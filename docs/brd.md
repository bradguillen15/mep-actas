# Documento de Requerimientos de Negocio (BRD)
## Sistema de Consulta de Títulos — MEP Costa Rica

| | |
|---|---|
| **Versión** | 2.1 — Draft |
| **Fecha** | Junio 2026 |
| **Estado** | Para revisión |
| **Alcance** | Piloto en una escuela → despliegue nacional |
| **Clasificación** | Interno — personal MEP |

> Nota de mantenimiento: este documento es la **fuente de verdad del producto**. El almacenamiento de archivos se definió como **Cloudflare R2** (el borrador original mencionaba Cloudinary; ver §8, §9 y §10).
> Cambio `seguridad-alcance-escuela-region`: la consulta y la escritura se limitan al ámbito del usuario (escuela o región) y la auditoría pasa a ser visible por ámbito para los niveles 1 a 4 (§6, §7.3 y §7.5).

---

## 1. Resumen ejecutivo

El Ministerio de Educación Pública (MEP) conserva los registros físicos de títulos de graduación de los estudiantes de las escuelas públicas de Costa Rica. Actualmente, cuando una persona solicita verificar si un estudiante se graduó, el personal debe buscar manualmente entre archivos de papel — un proceso lento y propenso a errores.

Este documento define los requisitos del **Sistema de Consulta de Títulos**: una aplicación web cerrada y autenticada que permite al personal del MEP registrar actas de graduación, asociar a los estudiantes que aparecen en ellas, digitalizar los folios físicos, y consultar instantáneamente si una persona se graduó — buscando por nombre o por número de identificación.

El sistema arranca como un piloto en una sola escuela y está diseñado para escalar a todas las escuelas del país sin necesidad de rehacer la arquitectura.

---

## 2. Planteamiento del problema

### 2.1 Situación actual
Los títulos físicos se almacenan en tomos organizados por escuela. El personal debe estimar en qué tomo y folio podría encontrarse una persona y buscar manualmente. No existe un índice digital, ni capacidad de búsqueda, ni visibilidad entre escuelas.

### 2.2 Puntos de dolor
- El personal invierte mucho tiempo en cada verificación individual.
- Los registros de décadas anteriores pueden estar mal archivados o en mal estado físico.
- No hay forma de confirmar rápidamente si una persona se graduó.
- No existe trazabilidad de quién consultó o modificó un registro.
- Escalar este proceso manualmente a cientos de escuelas no es viable.

### 2.3 Oportunidad
Un sistema digital de consulta — con un esfuerzo de digitalización inicial — reduce cada verificación de minutos a segundos y ofrece un registro confiable y auditable de todas las consultas y cambios.

---

## 3. Objetivos

| Objetivo | Descripción |
|---|---|
| Verificación rápida | El personal confirma una graduación en menos de 10 segundos |
| Costo mínimo | El sistema corre sobre tiers gratuitos, sin servidor propio que mantener |
| Escalabilidad nacional | El modelo de datos soporta todas las escuelas del MEP desde el día uno |
| Privacidad por defecto | El acceso es cerrado; solo usuarios autenticados consultan registros |
| Trazabilidad total | Todo cambio queda registrado en una auditoría inmutable |

---

## 4. Principio de diseño: registro digital, no copia del papel

Una decisión central de este diseño: **el sistema modela la realidad digital que queremos, no la estructura del archivo físico.**

Los tomos y folios existen porque el papel tiene límites físicos (un libro guarda ~100 páginas, las páginas se numeran en secuencia). Una base de datos no tiene esos límites. Por eso **no se modelan tomos ni folios como entidades estructurales con reglas** (sin auto-numeración, sin tope de folios por tomo). Esa información se conserva como **datos de referencia** para trazabilidad con el original físico.

La excepción es el **escaneo del folio**: una imagen física que una persona digitaliza y administra deliberadamente. Eso sí es una entidad digital real (ver sección 7.2), porque un folio se escanea una vez y ese escaneo se reutiliza en varias actas.

Lo que **sí** se conserva como concepto real del negocio:
- **Tipos de acta** (graduación, reposición, corrección) — describen qué evento ocurrió, no cómo se archivó.
- **Escaneos de folios** — administrados como recursos digitales reutilizables.
- **Número de tomo y folio** — como campos de referencia al original físico.

---

## 5. Conceptos del dominio

### 5.1 Jerarquía
```
País
└── Región
    └── Escuela
        └── Actas  (con número de tomo/folio como referencia)
            └── Estudiantes
```
Los **escaneos de folios** se administran por escuela y se vinculan a las actas, en paralelo a esta jerarquía.

### 5.2 Personas, funcionarios y usuarios
Una **persona** es la entidad base (identificación, nombres, apellidos). Una persona puede ser:
- **Estudiante** — aparece en una o más actas.
- **Funcionario** — puede firmar actas, puede pertenecer a varias escuelas, puede existir sin tener cuenta de usuario.
```
PERSONA → FUNCIONARIO → USUARIO
```
Un **usuario** es un funcionario con cuenta para acceder al sistema. No todos los funcionarios son usuarios.

### 5.3 Reglas del dominio
- **Funcionarios:** pueden pertenecer a varias escuelas y firmar miles de actas. Los firmantes cambian con el tiempo.
- **Actas:** se clasifican por tipo (configurable). Una acta puede tener cero, uno o muchos estudiantes. **Las actas son inmutables** una vez creadas.
  - *Graduación* — una acta, muchos estudiantes (la promoción).
  - *Reposición* — una acta, un estudiante (caso especial; debe hacerse en la escuela original).
  - *Corrección* — una acta, un estudiante (corrige un registro anterior).
- **Correcciones y reposiciones** enlazan a la acta original mediante `acta_referencia_id`.
- **Escaneos de folios:** se digitalizan en una sección de gestión dedicada, especificando escuela + tomo + folio. Un folio se escanea una vez y su imagen se reutiliza en todas las actas que lo referencian (sin duplicación).
- **Estudiantes:** una misma persona puede aparecer en varias actas (graduación, reposición, corrección).
- **Auditoría:** todo cambio queda registrado — usuarios, roles, estudiantes, actas, escaneos y configuración.

---

## 6. Roles y permisos

Los roles son **jerárquicos por nivel**. Cada nivel puede crear usuarios de su mismo nivel o inferiores.

| Rol | Nivel | Permisos |
|---|---|---|
| Admin País | 1 | Acceso total nacional. Gestiona regiones, escuelas, usuarios de cualquier nivel, configuración global. Ve toda la auditoría. |
| Admin Regional | 2 | Gestiona escuelas y usuarios dentro de su región. Configura valores por defecto regionales. Ve la auditoría de su región. |
| Admin Escuela | 3 | Gestiona actas, estudiantes y escaneos de su escuela. Crea usuarios staff de su escuela. Ve la auditoría de su escuela. |
| Staff | 4 | Consulta y registro de actas, estudiantes, firmantes y personas dentro de su escuela. Ve la auditoría de su escuela. No puede gestionar usuarios ni eliminar registros. |

- Primer arranque → asistente de configuración crea la primera cuenta Admin País (sin credenciales por defecto).
- No hay auto-registro: las cuentas se crean por invitación desde un nivel superior.

---

## 7. Requisitos funcionales

### 7.1 Gestión de actas
- Crear una acta asociada a una escuela, con tipo de acta, título, número de tomo, rango de folios (`folio_inicio` / `folio_fin`) y fecha.
- Asociar estudiantes a la acta, indicando su número de certificado.
- Registrar los funcionarios firmantes y su rol de firma (director, supervisor, etc.).
- Vincular la acta a uno o más escaneos de folios ya digitalizados.
- Para reposición/corrección, enlazar a la acta original mediante `acta_referencia_id`.
- Una vez creada, **la acta no se puede editar** (inmutable). Una corrección se hace mediante una nueva acta del tipo correspondiente.

### 7.2 Sección de gestión de escaneos (digitalización)
- Área dedicada donde el personal digitaliza folios físicos, de forma independiente al registro de actas.
- Al subir un escaneo, se especifica: escuela, número de tomo y número de folio.
- El sistema **obliga a un formato y convención de nombres** consistente para cada imagen.
- Cada folio se escanea **una sola vez**; el escaneo queda como recurso reutilizable.
- Un escaneo puede vincularse a varias actas (sin duplicar la imagen en el almacenamiento).
- Permite digitalizar un tomo completo (ej. 100 folios) en una sesión, antes o independientemente de registrar actas. Esto desacopla el flujo de digitalización del flujo de captura de datos.

### 7.3 Consulta
- Buscar por número de identificación (coincidencia exacta) o por nombre (coincidencia parcial).
- Los resultados muestran: nombre, identificación, escuela, acta, tipo de acta, fecha y número de certificado.
- Al abrir un resultado, mostrar el detalle del acta y, si existe, el escaneo del folio vinculado.
- Si no hay coincidencia, mostrar un mensaje claro de "Sin registros".
- La consulta se limita al ámbito del usuario: Admin País ve todo el país, Admin Regional las escuelas de su región y Admin Escuela y Staff su escuela. Lo que queda fuera del ámbito no se lista ni se puede abrir (se responde como si no existiera).
- Excepción: la búsqueda de una persona por identificación exacta está disponible para cualquier usuario autenticado y devuelve solo datos mínimos (id, nombres, apellidos e identificación), para evitar duplicar personas ya registradas en otra escuela.

### 7.4 Control de acceso y autenticación
- Todos los usuarios inician sesión con email y contraseña.
- Las contraseñas se almacenan como hash (bcrypt) — nunca en texto plano.
- Cada petición verifica el rol del usuario antes de ejecutar la acción.
- Un nivel superior puede crear, desactivar o restablecer contraseñas de niveles inferiores.

### 7.5 Auditoría
- Todo cambio se registra con: usuario, tabla, acción, datos anteriores, datos nuevos y fecha/hora.
- La auditoría es de solo lectura — ningún usuario puede modificarla o eliminarla.
- La auditoría es visible por ámbito para los niveles 1 a 4: Admin País ve toda; Admin Regional, la de su región; Admin Escuela y Staff, la de su escuela. Los registros de alcance nacional (sin escuela ni región) solo los ve Admin País.

### 7.6 Ayuda en la aplicación (manual de usuario)
- La aplicación incluye una sección de ayuda en `/ayuda` con el manual de usuario, accesible desde el menú lateral para los cuatro roles.
- El manual se organiza en temas por funcionalidad (iniciar sesión, consultar graduados, actas, tomos y escaneos, usuarios, configuración y auditoría). El contenido se escribe en español y se versiona en el repositorio junto con el código.
- La página `/ayuda` muestra un índice de temas con un buscador por título, descripción y palabras clave (sin distinguir mayúsculas ni tildes).
- Cada tema declara los niveles de rol a los que aplica. El filtrado se hace **en el servidor**: cada rol ve en el índice y puede abrir solo los temas de su nivel. Un tema inexistente o no permitido se responde como si no existiera (404).
- Cuando cambia una funcionalidad, se actualiza el tema correspondiente del manual.

---

## 8. Requisitos no funcionales

| Requisito | Detalle |
|---|---|
| Hospedaje | Web app desplegada en Vercel (tier gratuito). Sin servidor propio que mantener. |
| Base de datos | Turso (libSQL / SQLite gestionado), tier gratuito, con Drizzle ORM. |
| Almacenamiento de archivos | Cloudflare R2 (tier gratuito, almacenamiento de objetos compatible con S3) para escaneos de folios. URLs firmadas del lado del servidor. |
| Acceso | Sistema cerrado: solo usuarios autenticados. Sin acceso público. |
| Rendimiento | Resultados de búsqueda en menos de 2 segundos. |
| Idioma | Español (Costa Rica) en toda la interfaz, mensajes y documentación. |
| Privacidad | Cumple con la Ley 8968. El token de la base de datos vive solo en el servidor, nunca en el navegador. |
| Navegadores | Versiones actuales de Chrome y Firefox. Sin software cliente adicional. |
| Respaldos | Según capacidades de Turso; exportaciones periódicas de la base de datos. |

---

## 9. Arquitectura técnica

### 9.1 Stack

| Capa | Tecnología | Justificación |
|---|---|---|
| Framework | Next.js (App Router) | Frontend y API en un solo proyecto |
| Renderizado | Cliente (sin SSR) | Sistema cerrado autenticado, sin necesidad de SEO |
| Estado — datos | SWR | Fetching y caché de registros |
| Estado — sesión | React Context | Usuario actual / autenticación |
| Estado — formularios | useReducer | Formularios de alta, sin dependencias extra |
| Autenticación | NextAuth (JWT) | Sesiones por token, sin servicio externo |
| Base de datos | Turso (libSQL) + Drizzle ORM | SQLite gestionado, tier gratuito, acceso a datos tipado |
| Almacenamiento | Cloudflare R2 | Escaneos de folios (objetos S3), URLs firmadas del lado del servidor |
| Despliegue | Vercel | Tier gratuito; variables de entorno mantienen secretos en el servidor |

### 9.2 Modelo de seguridad
```
Navegador → API de Next.js (verifica sesión + rol) → Turso / R2
```
El navegador nunca se conecta directamente a Turso ni a R2. El token de la base de datos y las credenciales de R2 viven en variables de entorno de Vercel, accesibles solo del lado del servidor. La API de Next.js (route handlers) es el único punto que se conecta a la base de datos y al almacenamiento, y actúa como guardián de acceso. Las imágenes se sirven mediante URLs firmadas de corta duración generadas en el servidor.

### 9.3 Identidad visual y diseño
La interfaz sigue la identidad institucional del MEP (azul, dorado y blanco) para que el sistema se sienta parte oficial del ministerio. Se recomienda **confirmar los valores exactos contra el "Manual de Imagen Institucional" del MEP** antes de producción; los valores siguientes son una aproximación fiel basada en el sitio oficial (mep.go.cr).

#### Paleta de colores
| Rol | Color | Hex | Uso |
|---|---|---|---|
| Azul institucional | Primario | `#0B3C8C` | Barra superior, botones primarios, encabezados, enlaces |
| Azul oscuro | Primario hover | `#072A66` | Estados hover/activo de elementos azules |
| Dorado | Acento | `#D4A017` | Detalles, íconos destacados, subrayados, badges |
| Dorado claro | Acento suave | `#F2C94C` | Resaltados sutiles, fondos de acento |
| Blanco | Fondo base | `#FFFFFF` | Fondo principal de contenido |
| Gris superficie | Superficie | `#F4F6F9` | Tarjetas, filas alternas, fondos secundarios |
| Gris borde | Borde | `#D9DEE5` | Bordes, divisores, líneas de tabla |
| Texto | Texto principal | `#1F2733` | Texto de cuerpo y títulos |

#### Estados semánticos
| Estado | Hex | Uso |
|---|---|---|
| Éxito | `#1E7E45` | Confirmaciones (ej. "graduación encontrada") |
| Error | `#C0392B` | Errores y validaciones |
| Advertencia | `#D4A017` | Avisos (reusa el dorado) |
| Información | `#0B3C8C` | Mensajes informativos (reusa el azul) |

#### Lineamientos de diseño
- **Tipografía:** una tipografía sans-serif limpia y legible (ej. Inter o la del sitio del MEP). Títulos en peso medio, cuerpo en peso regular.
- **Logo:** incluir el logo oficial del MEP en la barra superior. Solicitar la versión vectorial (SVG) al equipo del ministerio.
- **Tono visual:** sobrio, institucional, alta legibilidad. Espaciado generoso, sin efectos decorativos (sin sombras fuertes ni degradados).
- **Accesibilidad:** contraste suficiente entre texto y fondo (WCAG AA). El azul `#0B3C8C` sobre blanco y el texto `#1F2733` cumplen este criterio.
- **Modo de implementación:** definir la paleta como variables CSS / tokens de diseño (ej. `--color-primario`, `--color-acento`) para mantener consistencia y permitir ajustes centralizados cuando se confirmen los valores oficiales.

---

## 10. Modelo de datos

### Jerarquía geográfica

**`regiones`**
| Campo | Tipo | Notas |
|---|---|---|
| id | INTEGER PK | |
| nombre | TEXT | |

**`escuelas`**
| Campo | Tipo | Notas |
|---|---|---|
| id | INTEGER PK | |
| region_id | INTEGER FK | → regiones.id |
| codigo_mep | TEXT | Código oficial MEP |
| nombre | TEXT | |

> Nota: la configuración por defecto vive a nivel de región y puede sobrescribirse por escuela. Si en el futuro se agregan parámetros configurables (ej. formato de escaneo), se modelan en una tabla `configuracion` con ámbito región/escuela, no como columnas fijas.

### Actas y estudiantes

**`tipos_acta`**
| Campo | Tipo | Notas |
|---|---|---|
| id | INTEGER PK | |
| nombre | TEXT | Graduación, Reposición, Corrección… (configurable) |
| activo | BOOLEAN | |

**`actas`** *(inmutable una vez creada)*
| Campo | Tipo | Notas |
|---|---|---|
| id | INTEGER PK | Identificador numérico auto-incremental |
| escuela_id | INTEGER FK | → escuelas.id |
| tipo_acta_id | INTEGER FK | → tipos_acta.id |
| acta_referencia_id | INTEGER FK | → actas.id (nullable; para reposición/corrección) |
| titulo | TEXT | Nombre/título del acta |
| numero_tomo | INTEGER | Referencia al original físico |
| folio_inicio | INTEGER | Referencia al original físico |
| folio_fin | INTEGER | Referencia al original físico |
| fecha | DATE | |
| created_at | TIMESTAMP | |

**`personas`**
| Campo | Tipo | Notas |
|---|---|---|
| id | INTEGER PK | |
| identificacion | TEXT | Cédula u otro ID — indexado para búsqueda |
| nombres | TEXT | |
| apellidos | TEXT | |

**`estudiantes`**
| Campo | Tipo | Notas |
|---|---|---|
| id | INTEGER PK | |
| persona_id | INTEGER FK | → personas.id |

**`acta_estudiantes`** *(puente acta ↔ estudiante)*
| Campo | Tipo | Notas |
|---|---|---|
| id | INTEGER PK | |
| acta_id | INTEGER FK | → actas.id |
| estudiante_id | INTEGER FK | → estudiantes.id |
| numero_certificado | INTEGER | |

### Escaneos de folios

**`escaneos`** *(recurso digital reutilizable, administrado en la sección de gestión)*
| Campo | Tipo | Notas |
|---|---|---|
| id | INTEGER PK | |
| escuela_id | INTEGER FK | → escuelas.id |
| numero_tomo | INTEGER | |
| numero_folio | INTEGER | |
| url | TEXT | Clave/URL del objeto en Cloudflare R2 |
| formato | TEXT | Convención de formato forzada |
| uploaded_by | INTEGER FK | → usuarios.id |
| created_at | TIMESTAMP | |

**`acta_escaneos`** *(puente acta ↔ escaneo — un escaneo se reutiliza en varias actas)*
| Campo | Tipo | Notas |
|---|---|---|
| id | INTEGER PK | |
| acta_id | INTEGER FK | → actas.id |
| escaneo_id | INTEGER FK | → escaneos.id |

### Funcionarios, firmantes y usuarios

**`funcionarios`**
| Campo | Tipo | Notas |
|---|---|---|
| id | INTEGER PK | |
| persona_id | INTEGER FK | → personas.id |
| puesto | TEXT | |

**`funcionario_escuela`** *(un funcionario puede pertenecer a varias escuelas)*
| Campo | Tipo | Notas |
|---|---|---|
| id | INTEGER PK | |
| funcionario_id | INTEGER FK | → funcionarios.id |
| escuela_id | INTEGER FK | → escuelas.id |

**`acta_firmantes`** *(funcionarios que firman un acta)*
| Campo | Tipo | Notas |
|---|---|---|
| id | INTEGER PK | |
| acta_id | INTEGER FK | → actas.id |
| funcionario_id | INTEGER FK | → funcionarios.id |
| rol_firma | TEXT | Director, Supervisor… |

**`roles`**
| Campo | Tipo | Notas |
|---|---|---|
| id | INTEGER PK | |
| nombre | TEXT | Admin País, Admin Regional, Admin Escuela, Staff |
| nivel | INTEGER | 1 = país … 4 = staff |

**`usuarios`**
| Campo | Tipo | Notas |
|---|---|---|
| id | INTEGER PK | |
| funcionario_id | INTEGER FK | → funcionarios.id |
| rol_id | INTEGER FK | → roles.id |
| email | TEXT UNIQUE | |
| password_hash | TEXT | bcrypt |
| activo | BOOLEAN | false = cuenta desactivada |

### Auditoría

**`auditoria`** *(solo lectura)*
| Campo | Tipo | Notas |
|---|---|---|
| id | INTEGER PK | |
| usuario_id | INTEGER FK | → usuarios.id |
| tabla | TEXT | Tabla modificada |
| registro_id | INTEGER | Registro modificado |
| accion | TEXT | crear / editar / desactivar… |
| datos_anteriores | TEXT (JSON) | |
| datos_nuevos | TEXT (JSON) | |
| escuela_id | INTEGER FK | → escuelas.id, nullable; escuela del recurso auditado |
| region_id | INTEGER FK | → regiones.id, nullable; región del recurso auditado |
| created_at | TIMESTAMP | |

---

## 11. Mejora futura — Lectura automática (OCR / IA)

Para acelerar la digitalización, una fase futura podría leer automáticamente el escaneo del folio y pre-llenar los campos del formulario (nombres, identificación, número de certificado).

**Consideración de costo:** esto requiere un servicio persistente que no cabe en el tier gratuito — por ejemplo, un VPS corriendo PaddleOCR, o el uso de una API de visión. PaddleOCR no corre de forma confiable en el entorno serverless de Vercel. Por esto se deja **fuera de la Fase 1**: el escaneo del folio ya resuelve el respaldo del documento; la lectura automática es solo una conveniencia adicional.

---

## 12. Plan de despliegue por fases

### Fase 1 — Piloto (una escuela)
- Desplegar la app web (Vercel + Turso + Cloudflare R2).
- Digitalizar el archivo existente (escaneo de folios + ingreso manual de actas).
- Capacitar a Admin Escuela y Staff.
- Operar 1–3 meses, recoger retroalimentación.

### Fase 2 — Expansión regional
- Incorporar más escuelas dentro de una región.
- Habilitar configuración por región y reportes regionales.
- Establecer flujo estándar de digitalización y materiales de capacitación.

### Fase 3 — Despliegue nacional
- Abrir la incorporación a todas las escuelas del MEP.
- Reportes y auditoría a nivel nacional para el liderazgo.
- Opcional: portal de autoconsulta ciudadana (solo la propia identificación) y lectura automática (OCR/IA).

---

## 13. Decisiones tomadas

- **Web app** (no Electron) — solo navegador, sin instalación.
- **Sin SSR** — React del lado del cliente, sistema cerrado.
- **Modelo aplanado** — sin tablas `tomos`/`folios` como entidades estructurales. El número de tomo/folio son campos de referencia en el acta.
- **`escaneos` como entidad propia** — administrados en una sección dedicada, con formato forzado, reutilizables entre actas (sin duplicar imágenes).
- **`tipos_acta` se mantiene** — graduación, reposición, corrección (evento real, no mecánica de papel).
- **`acta_referencia_id`** — enlaza reposiciones/correcciones a la acta original.
- **Actas inmutables** — las correcciones se hacen con nuevas actas, respaldadas por la auditoría.
- **Sin hashing de imágenes** — la duplicación se evita en origen: cada folio se escanea una vez y se reutiliza.
- **`personas` ≠ `usuarios`** — los usuarios son funcionarios con cuenta; las personas son todos los demás.
- **Almacenamiento en Cloudflare R2** — objetos compatibles con S3, URLs firmadas del lado del servidor (reemplaza la mención original a Cloudinary).
- **Acceso a datos con Drizzle ORM** sobre Turso/libSQL.
- **Sin OCR en Fase 1** — ingreso manual; OCR es mejora futura con costo asociado.
- **Sin circuitos** — no se modelan.
- **Identidad visual MEP** — paleta azul/dorado/blanco basada en el sitio oficial; valores exactos por confirmar contra el Manual de Imagen Institucional.

---

## 14. Preguntas abiertas

| Pregunta | Notas |
|---|---|
| ¿Volumen estimado de registros del piloto? | Define el cronograma de ingreso manual. |
| ¿Quién es el responsable técnico a largo plazo? | ¿Departamento de TI del MEP? Afecta mantenimiento. |
| ¿Hay requisito legal de conservar los títulos físicos tras digitalizar? | Probablemente sí, por política del MEP. |
| ¿Se requiere exportación de reportes (PDF/Excel) en Fase 1? | Por confirmar. |
| ¿Qué formato exacto se forzará para los escaneos? | Resolución, tipo de archivo (JPG/PDF), convención de nombres. |
| ¿Valores oficiales exactos de la paleta y logo SVG del MEP? | Confirmar contra el Manual de Imagen Institucional y solicitar el logo vectorial. |

---

## 15. Métricas de éxito

| Métrica | Meta |
|---|---|
| Tiempo promedio de verificación | Menos de 10 segundos (vs. varios minutos hoy) |
| Registros digitalizados en el piloto | 100% del archivo físico existente |
| Adopción del personal | Todo el personal del piloto usando el sistema en 30 días |
| Tasa de error de ingreso | < 1% (validado por muestreo contra títulos físicos) |

---

*Fin del documento — v2.1 Draft*
