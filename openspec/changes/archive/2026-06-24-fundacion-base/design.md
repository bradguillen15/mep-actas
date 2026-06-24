## Context

El proyecto `mep-actas` parte de cero. No existe `package.json`, scaffold, configuración de base de datos, autenticación ni almacenamiento. El equipo de IA necesita una línea base técnica sólida antes de construir cualquier feature. Este diseño cubre la fundación: proyecto Next.js, Drizzle + Turso, NextAuth con roles, Cloudflare R2 y auditoría.

## Goals / Non-Goals

**Goals:**
- Crear el scaffold de Next.js con App Router, TypeScript, Tailwind y tokens de diseño MEP
- Definir el esquema Drizzle completo (15 tablas del BRD §10) con migración inicial
- Configurar NextAuth con JWT en httpOnly cookies y rate limiting en login
- Implementar verificación de autorización por nivel jerárquico + ámbito
- Integrar Cloudflare R2 con URLs firmadas del lado del servidor
- Construir el servicio de auditoría como guardián obligatorio de toda escritura
- Generar documentación base: `data-model.md`, `.env.example`, `api-spec.yml`

**Non-Goals:**
- No se crean endpoints de API ni páginas funcionales (eso viene en features posteriores)
- No se configura Playwright ni pruebas E2E (no hay flujos de usuario aún)
- No se implementa migración de bases de datos real a Turso (solo esquema y configuración)
- No se crea la UI de login ni páginas protegidas

## Decisions

### JWT en httpOnly cookies vs. localStorage
**Decisión:** httpOnly cookies.

| Alternativa | Voto negativo |
|---|---|
| **localStorage** | XSS puede leer el token. Una vez exfiltrado, el atacante tiene acceso persistente. |
| **httpOnly cookies** | Inaccesible desde JS. XSS no puede leerlo. CSRF mitigado con SameSite=Lax. |

El costo es que el frontend no puede leer el token directamente, pero NextAuth maneja esto de forma transparente.

### Rate limiter en memoria vs. Vercel KV vs. servicio externo
**Decisión:** `Map` en memoria con ventana deslizante.

| Alternativa | Voto negativo |
|---|---|
| **Vercel KV (Upstash Redis)** | Dependencia externa para el piloto; costo y latencia de red adicional. |
| **Servicio externo** | Overkill para una app que arranca como piloto en una escuela. |
| **Map en memoria** | ✅ Zero dependencias, suficiente para el piloto. La limitación: no persiste entre redeploys de Vercel (serverless). |

**Riesgo mitigado:** en serverless, cada instancia tiene su propio Map. Un atacante podría rotar entre instancias. Para el piloto con tráfico bajo es aceptable; documentar que en producción se migre a Vercel KV.

### Arquitectura de capas: 3 capas pragmáticas
**Decisión:** Route handler → Servicio → Repositorio.

Sin ceremonia DDD (sin `entity.save()`, sin 4 capas formales). Cada capa tiene responsabilidades claras:

| Capa | Responsabilidad | No hace |
|---|---|---|
| Route handler | Verificar sesión+rol, validar input con Zod, mapear respuesta HTTP | Acceder a DB ni lógica de negocio |
| Servicio | Lógica de negocio, orquestación, auditoría | Armar respuestas HTTP ni consultas Drizzle |
| Repositorio | Consultas Drizzle aisladas | Lógica de negocio ni formateo HTTP |

### Separación SRP del módulo de autenticación
**Decisión:** 3 archivos + 1 de tipos.

- `auth.config.ts` — Configuración de NextAuth (proveedores, callbacks, JWT)
- `sesion.servicio.ts` — `obtenerSesion()`: abstrae `getServerSession`
- `autorizacion.servicio.ts` — `verificarRol()`: lógica pura de nivel + ámbito
- `tipos.ts` — `SesionUsuario`, `NivelRol`, `AmbitoVerificacion`

### auditoría como dependencia inyectada
**Decisión:** el servicio de auditoría es un parámetro obligatorio en toda función de escritura.

```typescript
type Auditor = (params: RegistroAuditoria) => Promise<void>;

function crearActa(datos: CrearActa, auditor: Auditor): Promise<Acta>
```

No hay forma de escribir sin pasar un `auditor`. Esto fuerza el registro en tiempo de compilación, no en code review.

### Key convention de R2 con sanitización
**Decisión:** `escaneos/{escuela_id}/{tomo}/{folio}.{ext}` con validación estricta.

Los parámetros numéricos (`escuela_id`, `tomo`, `folio`) se validan como enteros positivos. La extensión se limita a `jpg`, `jpeg`, `png`, `pdf`. Cualquier carácter que no sea alfanumérico o punto se rechaza.

## Risks / Trade-offs

| Riesgo | Mitigación |
|---|---|
| Rate limiter en memoria no funciona entre instancias serverless | Documentar que es provisional; plan de migración a Vercel KV para despliegue nacional |
| Sin SSR: el layout raíz con `"use client"` no puede importar módulos de servidor | Separación estricta: todo lo que necesita Node.js va en `src/server/`, nunca se importa desde `app/*.tsx` |
| El esquema Drizzle inicial puede tener errores en las relaciones | Migración inicial generada y revisada antes de aplicar a producción |
| Las credenciales de R2 se exponen si alguien hace `console.log` del cliente | El cliente se inicializa una vez y se cachea; no se loguean las credenciales |

## Open Questions

- ¿El rate limiter en memoria es suficiente para el piloto, o preferimos Vercel KV desde el inicio?
- ¿Confirmar los valores hex exactos de la paleta contra el Manual de Imagen Institucional del MEP antes de producción?
