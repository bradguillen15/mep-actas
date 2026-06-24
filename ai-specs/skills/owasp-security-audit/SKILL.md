---
name: owasp-security-audit
description: Úsalo al realizar una auditoría de ciberseguridad, revisión de seguridad, verificación de cumplimiento OWASP Top 10, evaluación de vulnerabilidades o preparación de una prueba de penetración en una aplicación Next.js (App Router) con Drizzle/Turso, NextAuth y Cloudflare R2.
---

# Auditoría de Seguridad OWASP Top 10

## Resumen

Metodología sistemática para auditar aplicaciones web contra el OWASP Top 10:2021. Combina herramientas automatizadas con revisión manual de código y produce un plan de remediación priorizado con pasos de verificación e integración en CI/CD.

**Principio central:** cada hallazgo debe verificarse con herramientas o evidencia en el código, priorizarse por explotabilidad y acompañarse de una corrección concreta que el agente pueda implementar.

Stack objetivo: **Next.js (App Router)**, route handlers en `app/api`, **Drizzle ORM** sobre **Turso (libSQL)**, **NextAuth (JWT)**, **Cloudflare R2**, despliegue en **Vercel**. Producto del Gobierno de Costa Rica (Ley 8968 de protección de datos).

## Cuándo usarla

- Solicitud de auditoría o revisión de seguridad.
- Evaluación de cumplimiento OWASP Top 10.
- Compuerta de seguridad previa a un release o preparación de pentest.
- Endurecimiento posterior a un incidente.
- Triaje de vulnerabilidades en dependencias.

**Cuándo NO usarla:**
- Arreglo puntual de una vulnerabilidad conocida (solo arréglala).
- Revisión general de calidad de código (usa la skill `code-auditing`).
- Revisión de seguridad de infraestructura/nube (fuera de alcance; esto cubre la capa de aplicación).

## Metodología

### Fase 0: Preparación y escaneos automatizados

Corre las herramientas automáticas PRIMERO — atrapan lo evidente antes de la revisión manual.

| Herramienta | Comando | Cubre |
|------|---------|--------|
| npm/pnpm audit | `pnpm audit --json` (o `npm audit --json`) | A06: CVEs conocidos en dependencias |
| ESLint security | `npx eslint --plugin security .` | A03, A05: vulnerabilidades a nivel de código |
| Desactualizados | `pnpm outdated` | A06: paquetes desactualizados |
| Escaneo de secretos | `rg -i '(password\|secret\|api_key\|token)\s*[:=]' --glob '!node_modules' --glob '!*.lock'` | A02: secretos embebidos |
| Revisión de .gitignore | Verifica que `.env`, `*.pem`, `*.key` estén en `.gitignore` | A02: secretos versionados |
| Secretos en historial git | `git log --all --diff-filter=A -- '*.env' '*.pem' '*.key'` | A02: secretos en el historial |
| Código de depuración/telemetría | `rg 'fetch\(.*127\.0\.0\.1\|localhost:[0-9]{4}' --glob '*.{ts,js,jsx,tsx}'` | A04: peticiones salientes solo de desarrollo |
| `NEXT_PUBLIC_` con secretos | `rg 'NEXT_PUBLIC_.*(SECRET\|TOKEN\|KEY\|PASSWORD)' ` | A02: secretos expuestos al navegador |

**Registra métricas base:** total de vulnerabilidades por severidad, cantidad de dependencias desactualizadas, hits del escaneo de secretos.

### Fase 1: Auditoría sistemática por categoría

Audita TODAS las categorías con el checklist de Referencia Rápida. No omitas ninguna aunque parezca irrelevante: documenta "N/A" con justificación.

Para cada categoría: corre las verificaciones, registra hallazgos con ruta y línea y severidad, y anota qué revisaste aunque esté limpio (demuestra exhaustividad).

### Fase 2: Clasificación de hallazgos

| Severidad | Criterio | Ejemplo |
|----------|----------|---------|
| **Crítica** | Explotable remotamente, sin auth, fuga de datos probable | Credenciales de BD embebidas en git, sin autenticación |
| **Alta** | Explotable con esfuerzo, impacto significativo | Faltan cabeceras de seguridad, sin rate limiting, IDOR |
| **Media** | Requiere condiciones específicas, impacto moderado | Dependencias desactualizadas sin exploit conocido, validación débil |
| **Baja** | Impacto mínimo o explotación poco probable | Ajuste fino de CSP, mensajes de error verbosos en dev |

### Fase 3: Plan de remediación priorizado

**Fase A — Inmediato (< 1 día, crítica/alta):** rotar credenciales expuestas; agregar verificación de sesión/rol en route handlers; configurar cabeceras de seguridad; agregar rate limiting; corregir `.gitignore` y purgar secretos del historial.

**Fase B — Corto plazo (1–3 días, alta/media):** RBAC por jerarquía; sanitización/validación de entrada (Zod); logging estructurado; límites de tamaño de cuerpo; protección CSRF donde aplique.

**Fase C — Mediano plazo (1–2 semanas, media/baja):** actualizar dependencias; pipeline de seguridad en CI/CD; auditoría inmutable; monitoreo/alertas.

Cada corrección incluye: qué cambiar, dónde, un ejemplo de código y cómo verificarlo.

### Fase 4: Verificación e integración CI/CD

Para cada remediación define una verificación: prueba unitaria (Vitest) o E2E (Playwright) que valide el control, y un check de CI que prevenga regresiones.

## Referencia Rápida: Checklist OWASP Top 10

### A01: Control de acceso roto

**Paso 1: enumera todos los endpoints.** Corre `rg -l 'export (async )?function (GET|POST|PUT|PATCH|DELETE)' app/api` y lista cada `route.ts`. Verifica que CADA UNO valide sesión y rol.

| Verificación | Cómo | Severidad si falta |
|-------|-----|-------------------|
| Verificación de sesión en TODOS los route handlers | Revisa que cada handler valide la sesión de NextAuth | Crítica |
| Autorización por rol (jerarquía País/Regional/Escuela/Staff) | Revisa el chequeo de rol antes de acceder a datos | Crítica |
| Protección IDOR | Verifica chequeo de propiedad/ámbito (p. ej. filtrar por `escuela_id` del usuario) | Alta |
| CORS | Si se exponen endpoints a otros orígenes, sin comodín en producción | Alta |
| Protección CSRF | NextAuth mitiga en su flujo; verifica mutaciones sensibles | Media |
| Autorización en servidor (no solo UI) | Confirma que ocultar acciones en la UI no sustituye la validación del servidor | Crítica |

### A02: Fallas criptográficas

| Verificación | Cómo | Severidad si falta |
|-------|-----|-------------------|
| Sin secretos embebidos | `rg '(password\|secret\|key)\s*[:=]\s*["\x27]' --glob '!*.lock'` | Crítica |
| `.env` en `.gitignore` | `rg '\.env' .gitignore` — verificar que NO esté comentado | Crítica |
| Secretos en historial git | `git log --all --diff-filter=A -- '*.env' '*.pem'` — si hay, recomendar purga con `bfg-repo-cleaner` | Crítica |
| Secretos solo en servidor | El token de Turso y las credenciales de R2 NO usan prefijo `NEXT_PUBLIC_` | Crítica |
| HTTPS forzado | Vercel sirve HTTPS; verificar HSTS en cabeceras | Alta |
| Filtrado de PII | Revisar respuestas del API por campos personales innecesarios (Ley 8968) | Media |
| Hash de contraseñas | Verificar bcrypt/argon2, no SHA/MD5 | Crítica |

### A03: Inyección

| Verificación | Cómo | Severidad si falta |
|-------|-----|-------------------|
| Sin SQL crudo | `rg 'sql`raw\|execute\(`\|\.run\(`' src` — preferir el query builder de Drizzle | Crítica |
| Consultas parametrizadas (Drizzle) | Verificar acceso a datos vía Drizzle, sin concatenar cadenas SQL | Crítica |
| Validación de entrada en todos los endpoints | Revisar que cada route handler valide (Zod) antes de tocar la base | Alta |
| Sanitización del nombre de archivo subido | Revisar la clave/nombre del objeto en R2 (sin `originalname` crudo) | Alta |
| Allowlist de campos de orden/filtro | Verificar nombres de campo del usuario contra una allowlist | Media |
| Sin `eval()` ni `Function()` | `rg 'eval\(\|new Function\(' --glob '*.{ts,js}'` | Crítica |
| Prevención de asignación masiva | Verificar que el cuerpo NO se vuelque directo en `insert`/`update` de Drizzle — usar allowlist explícita de campos | Alta |

### A04: Diseño inseguro

| Verificación | Cómo | Severidad si falta |
|-------|-----|-------------------|
| Límite de tamaño del cuerpo | Verificar validación de tamaño en route handlers / `middleware.ts` | Media |
| Restricciones de tamaño/tipo de archivo | Revisar la validación antes de firmar la URL de subida a R2 | Alta |
| Sin traversal de rutas | La clave del objeto en R2 se genera/sanitiza en servidor; no se confía en la entrada | Alta |
| Validación no evitable | Verificar que la validación no se salte con campos extra | Alta |
| Sin endpoints de depuración en producción | `rg 'fetch\(.*127\.0\.0\.1\|localhost:[0-9]' --glob '*.{ts,tsx}'` | Alta |
| Errores no filtran internos | Verificar que los 500 devuelvan mensajes genéricos | Media |
| Actas inmutables respetadas | Verificar que no existan endpoints que editen/eliminen actas | Alta |

### A05: Configuración de seguridad incorrecta

| Verificación | Cómo | Severidad si falta |
|-------|-----|-------------------|
| Cabeceras de seguridad | Configuradas en `next.config.js` (`headers()`) o `middleware.ts` (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) | Alta |
| `x-powered-by` deshabilitado | `poweredByHeader: false` en `next.config.js` | Baja |
| Rate limiting | Verificar limitador en `middleware.ts` (p. ej. `@upstash/ratelimit`) en endpoints sensibles (login) | Alta |
| CORS estricto | Si aplica, `origin` no es `*` ni `true` | Alta |
| Validación de variables de entorno | Validación al arranque de las env requeridas (Turso/R2/NextAuth) | Media |
| Sin credenciales por defecto | Revisar seeds/configs por contraseñas embebidas; el primer Admin País se crea por asistente | Media |
| CSP | Verificar `Content-Security-Policy` restringiendo `script-src`, `connect-src`, `img-src` (incluir el dominio de R2) | Alta |

### A06: Componentes vulnerables y desactualizados

| Verificación | Cómo | Severidad si falta |
|-------|-----|-------------------|
| `audit` limpio | `pnpm audit --json`, contar crítica/alta | Varía |
| Runtime de Node no EOL | Revisar `engines` y la versión de runtime de Vercel | Media |
| Sin paquetes obsoletos | `pnpm outdated`, brechas de versión mayor | Baja |
| Lock file versionado | Verificar `pnpm-lock.yaml`/`package-lock.json` en git | Media |
| TypeScript actual | Revisar versión en `package.json` | Baja |
| Sin scripts `postinstall` sospechosos | `rg '"preinstall\|postinstall"' node_modules/*/package.json \| head -20` | Media |

### A07: Fallas de identificación y autenticación

| Verificación | Cómo | Severidad si falta |
|-------|-----|-------------------|
| Mecanismo de auth | Verificar configuración de NextAuth | Crítica |
| Política de contraseñas | Validación de longitud/complejidad al crear/restablecer | Alta |
| Bloqueo tras intentos fallidos | Protección contra fuerza bruta en login | Alta |
| Expiración de sesión/token | Verificar expiración del JWT de NextAuth | Alta |
| Flags seguros de cookies | `httpOnly`, `secure`, `sameSite` en cookies de sesión | Media |
| Sin auto-registro | Confirmar que las cuentas se crean por invitación desde un nivel superior | Alta |

### A08: Fallas de integridad de software y datos

| Verificación | Cómo | Severidad si falta |
|-------|-----|-------------------|
| Sanitización de entradas de texto | Buscar `xss`, `sanitize-html` o `DOMPurify` donde se renderice contenido | Media |
| Sin `dangerouslySetInnerHTML` sin sanitizar | `rg 'dangerouslySetInnerHTML' --glob '*.{tsx,jsx}'` | Alta |
| Sanitización de URL en `href`/`src` | Filtrar protocolo `javascript:` | Alta |
| Integridad del lock file | Verificar hashes de integridad del lock file | Baja |

### A09: Fallas de registro y monitoreo

| Verificación | Cómo | Severidad si falta |
|-------|-----|-------------------|
| Logging estructurado (no console.log) | Buscar `pino`/`winston` o logger estructurado | Alta |
| Auditoría de operaciones CRUD | Verificar que crear/editar/desactivar se registren en `auditoria` con actor | Alta |
| Sin PII en logs de error | Revisar manejadores de error por fuga de datos (Ley 8968) | Media |
| Prevención de inyección en logs | Verificar que la entrada del usuario no se interpole en plantillas de log | Baja |
| Registro de auth fallido | Verificar que respuestas 401/403 se registren | Media |
| Auditoría de solo lectura | Confirmar que no existen endpoints que modifiquen/eliminen `auditoria` | Alta |

### A10: Falsificación de petición del lado servidor (SSRF)

| Verificación | Cómo | Severidad si falta |
|-------|-----|-------------------|
| Sin peticiones salientes desde entrada del usuario | `rg 'fetch\(\|axios\.' --glob 'app/api/**/*.ts' --glob 'src/server/**/*.ts'` | Alta |
| Allowlist de URLs externas | Verificar que las URLs salientes se validen contra una allowlist | Alta |
| Sin redirecciones controladas por el usuario | Revisar endpoints de redirección por open redirect | Media |
| Operaciones de archivo con rutas/claves seguras | La clave del objeto R2 se genera en servidor; sin `path.join(entradaUsuario)` sin validar | Media |

## Verificación específica de Next.js / Vercel

| Verificación | Cómo | Severidad si falta |
|-------|-----|-------------------|
| Secretos solo del lado del servidor | Confirmar que Turso/R2/NextAuth NO usan `NEXT_PUBLIC_` | Crítica |
| Cabeceras de seguridad en `next.config.js` | CSP, HSTS, X-Frame-Options, Referrer-Policy | Alta |
| Rate limiting en `middleware.ts` | Sobre endpoints de login y mutación | Alta |
| URLs firmadas de R2 de corta duración | Verificar expiración y que el navegador nunca reciba credenciales | Alta |
| Variables de entorno de Vercel | Marcadas como secretas; no expuestas al cliente | Media |

## Comandos de verificación en runtime

Tras implementar las correcciones, verifica con peticiones reales (ajusta el puerto de `next dev`, p. ej. 3000):

```bash
# Cabeceras de seguridad
curl -sI http://localhost:3000/ | grep -iE '(x-powered-by|x-content-type|strict-transport|x-frame|content-security-policy)'

# Rate limiting en login
for i in $(seq 1 50); do curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/auth/callback/credentials; done | sort | uniq -c

# Auth requerida (debe responder 401/redirección)
curl -s http://localhost:3000/api/actas -w "\n%{http_code}"

# Secreto no expuesto al cliente (no debe aparecer en el bundle)
rg 'TURSO_AUTH_TOKEN|R2_SECRET' .next/static 2>/dev/null && echo "FUGA" || echo "OK"
```

## Plantilla de reporte

```markdown
# Reporte de Auditoría de Seguridad OWASP Top 10

- **Proyecto**: [nombre]
- **Stack**: Next.js + Drizzle/Turso + NextAuth + Cloudflare R2 (Vercel)
- **Fecha**: [YYYY-MM-DD]
- **Alcance**: Análisis estático + herramientas automatizadas

## Resultados de escaneos automatizados
### pnpm audit
- Crítica: X | Alta: X | Media: X | Baja: X
### Escaneo de secretos
- Hits: X — Ubicaciones: [lista]

## Hallazgos por categoría
### A01: Control de acceso roto — [CRÍTICA/ALTA/MEDIA/BAJA/LIMPIO]
**Revisado:** [qué se examinó]
**Hallazgos:** [con referencias archivo:línea]
**Remediación:** [ejemplos de código]
[...repetir A02–A10...]

## Matriz de prioridad
| Fase | Hallazgo | Severidad | Esfuerzo | Corrección |
|------|----------|-----------|----------|------------|

## Checklist de verificación
- [ ] [Hallazgo]: [cómo verificar la corrección]

## Integración CI/CD
- [ ] `pnpm audit` en CI (falla en crítica/alta)
- [ ] Plugin de seguridad de ESLint en pre-commit
- [ ] Bot de actualización de dependencias (Dependabot/Renovate)
- [ ] Escaneo de secretos en CI (gitleaks)
```

## Errores comunes

| Error | Por qué está mal | Corrección |
|---------|----------------|-----|
| Omitir categorías marcadas "N/A" sin evidencia | El auditor asumió en lugar de verificar | Documenta siempre qué revisaste |
| No correr herramientas automáticas | Se pierden CVEs trivialmente explotables | Corre `pnpm audit` y el escaneo de secretos PRIMERO |
| Reportar hallazgos sin código de corrección | Crean trabajo, no progreso | Cada hallazgo necesita una corrección a nivel de código |
| No priorizar | Tratar todo igual paraliza al equipo | Usa la matriz de severidad y el agrupamiento por fases |
| Olvidar CI/CD | Las auditorías manuales se pudren; solo las compuertas automáticas persisten | Incluye pasos de integración en el pipeline |
| Auditar solo backend O frontend | Los vectores XSS cruzan la frontera | Audita ambos, traza el flujo de datos de punta a punta |
| Confiar en que el ORM elimina toda inyección | Drizzle previene inyección SQL pero no la asignación masiva ni otros tipos | Verifica asignación masiva, inyección en logs, traversal |
| Omitir `.gitignore` e historial git | Los secretos eliminados del código pueden seguir en el historial | Revisa `.gitignore` Y `git log` Y recomienda purga si hace falta |
| Solo análisis estático | Algunas vulnerabilidades solo aparecen en runtime (CSP, rate limits) | Incluye comandos de verificación en runtime |

## Endurecimiento específico de Next.js

Cabeceras de seguridad en `next.config.js`:

```javascript
// next.config.js
const cabecerasSeguridad = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; img-src 'self' https://<tu-bucket>.r2.dev data:; connect-src 'self'" },
];

module.exports = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: cabecerasSeguridad }];
  },
};
```

Verificación de sesión + rol en un route handler:

```typescript
// app/api/actas/route.ts
import { getServerSession } from 'next-auth';
import { opcionesAuth } from '@/server/auth/opciones';

export async function POST(req: Request) {
  const sesion = await getServerSession(opcionesAuth);
  if (!sesion) return Response.json({ error: { codigo: 'sin_sesion', mensaje: 'No autenticado' } }, { status: 401 });
  if (sesion.usuario.nivel > 3) return Response.json({ error: { codigo: 'rol_insuficiente', mensaje: 'Sin permiso' } }, { status: 403 });
  // validar entrada (Zod) → servicio → respuesta
}
```

## Notas de seguridad para Drizzle / Turso / R2

- Usa `select` explícito para limitar los campos devueltos (evita fuga de PII; Ley 8968).
- Nunca expongas `TURSO_AUTH_TOKEN` ni credenciales de R2 al cliente (sin `NEXT_PUBLIC_`).
- Cuidado con el bypass de validación cuando el `id` viene en el cuerpo de la petición.
- Drizzle previene inyección SQL pero NO la asignación masiva: valida los campos permitidos explícitamente (Zod + allowlist).
- Las URLs de subida/lectura de R2 se firman en el servidor y expiran rápido; el navegador nunca recibe credenciales.
