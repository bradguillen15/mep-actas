# Inicialización del proyecto

El harness de desarrollo con IA (OpenSpec + agentes + estándares) ya está copiado y **adaptado a este proyecto**: Next.js + Turso/Drizzle + NextAuth + Cloudflare R2, pruebas con Vitest/Playwright, y todo en español. Esta guía resume qué ya está listo y qué falta para tener la aplicación corriendo.

---

## 1. Qué ya está adaptado (harness)

Estos archivos definen **cómo trabajan los agentes de IA** y ya reflejan el stack y el idioma del proyecto:

```
CLAUDE.md, AGENTS.md            # reglas globales (español, modelo de planificación)
docs/base-standards.md          # principios, TDD, estándar de idioma (español)
docs/backend-standards.md       # Next.js route handlers, Drizzle/Turso, seguridad, pruebas
docs/frontend-standards.md      # Next.js/React, SWR/Context/useReducer, identidad MEP
docs/documentation-standards.md # documentación en español
docs/openspec-tasks-mandatory-steps.md  # pasos obligatorios (Vitest/Playwright, sin curl)
openspec/config.yaml            # contexto y reglas del proyecto
ai-specs/agents/*.md            # backend-developer y frontend-developer adaptados
docs/brd.md                     # requerimientos de negocio (fuente de verdad)
```

No necesitas tocarlos para empezar una feature; los agentes los leen automáticamente.

---

## 2. Qué falta crear (aplicación)

| Elemento | Propósito | Cuándo |
|---|---|---|
| Scaffold de Next.js (`app/`, `package.json`, `tsconfig.json`, …) | Estructura de la app | Primer paso de implementación |
| Esquema Drizzle (`src/db/esquema.ts`) + `drizzle.config.ts` | Modelo de datos (ver BRD §10) | Antes del primer trabajo de datos |
| Cliente Turso/Drizzle (`src/db/cliente.ts`) | Acceso a datos (solo servidor) | Con el esquema |
| Configuración de NextAuth | Sesión + roles | Antes de cualquier endpoint protegido |
| Integración con Cloudflare R2 | Subida/lectura de escaneos (URLs firmadas) | Antes de la gestión de escaneos |
| `docs/data-model.md` | Modelo de dominio y datos | Derivar del BRD §10 |
| `docs/api-spec.yml` | Contratos de la API | Antes de la primera feature de backend |
| `docs/development_guide.md` | Cómo instalar, correr y probar | Cuando la app sea ejecutable |

Stubs mínimos para desbloquear a los agentes:

```bash
touch docs/api-spec.yml docs/data-model.md docs/development_guide.md
```

---

## 3. Variables de entorno

Crea `.env.example` (se versiona) y `.env` (NO se versiona — ya está en `.gitignore`). Los secretos viven solo en el servidor:

```
# Turso (libSQL)
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Cloudflare R2 (compatible con S3)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
```

Nunca uses el prefijo `NEXT_PUBLIC_` para secretos: eso los expondría al navegador.

---

## 4. Verificar el harness de OpenSpec

```bash
npm install -g @fission-ai/openspec
openspec --version
openspec schemas
```

En Cursor o Claude Code:
1. Abre el proyecto.
2. Ejecuta `/opsx:onboard` para un primer ciclo guiado.
3. O `/opsx:new <mi-primera-feature>` para empezar manualmente.

---

## 5. Uso día a día

| Paso | Comando / skill | Qué hace |
|---|---|---|
| Enriquecer una historia | `enrich-us` | Ticket → spec lista para implementar |
| Iniciar un cambio | `/opsx:new` | Crea `openspec/changes/<nombre>/` |
| Generar artefactos | `/opsx:ff` | proposal → specs → design → tasks |
| Implementar | `/opsx:apply` | El agente trabaja el `tasks.md` |
| Verificar | `/opsx:verify` | Compara implementación vs specs |
| Archivar | `/opsx:archive` | Mueve el cambio al archivo y sincroniza `openspec/specs/` |

Los docs específicos del proyecto (`api-spec.yml`, `data-model.md`) los actualizan los agentes durante la implementación cuando cambian endpoints o modelos — ver `docs/documentation-standards.md`.

---

## 6. Checklist de arranque

- [ ] Scaffold de Next.js creado
- [ ] Esquema Drizzle + cliente Turso configurados (BRD §10)
- [ ] NextAuth configurado (sesión + roles jerárquicos)
- [ ] Integración con Cloudflare R2 (URLs firmadas)
- [ ] `.env.example` y `.env` creados (secretos solo en servidor)
- [ ] `docs/data-model.md` creado
- [ ] `docs/api-spec.yml` creado
- [ ] `docs/development_guide.md` creado
- [ ] OpenSpec CLI instalado
- [ ] `/opsx:onboard` completado o primer cambio iniciado
