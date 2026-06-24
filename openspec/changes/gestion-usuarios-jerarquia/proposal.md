## Why

El BRD §6 exige que las cuentas se creen **por invitación desde un nivel superior** y que **cada nivel solo pueda crear usuarios de su mismo nivel o inferior**, dentro de su ámbito (un Admin Regional limitado a su región; un Admin Escuela limitado a su escuela). Hoy el servicio de usuarios recibe la sesión solo para auditar y la ruta solo exige `nivel <= 2`: nada impide que un Admin Regional cree un Admin País, ni que un administrador gestione usuarios fuera de su región/escuela. Esto es una brecha de control de acceso que contradice el modelo de roles del producto.

## What Changes

- Aplicar la **regla de jerarquía** en la creación de usuarios: el `rol_id` del nuevo usuario SHALL tener un `nivel` **igual o mayor** (es decir, mismo nivel o inferior en privilegio) al del actor de la sesión. **BREAKING** para clientes que hoy crean usuarios de cualquier nivel.
- Aplicar **validación de ámbito**: Admin Regional solo crea/gestiona usuarios cuyo funcionario pertenece a su región; Admin Escuela solo dentro de su escuela; Admin País sin restricción de ámbito.
- Extender la misma jerarquía + ámbito a **restablecer contraseña** y **activar/desactivar** usuarios.
- Cerrar la brecha de pruebas: agregar pruebas unitarias/E2E **entre roles** (hoy `usuarios.test.ts` prepara `sesionAdminRegional` pero nunca la usa), cubriendo casos permitidos y denegados.
- Agregar **UI de gestión de usuarios** para administradores (listar, invitar/crear, restablecer contraseña, activar/desactivar), respetando los permisos del rol en sesión. Sin auto-registro.

## Capabilities

### New Capabilities
- `gestion-usuarios`: gestión del ciclo de vida de cuentas de usuario por invitación (crear, restablecer contraseña, activar/desactivar) con enforcement de la jerarquía de roles y del ámbito (región/escuela), más la UI de administración.

### Modified Capabilities
<!-- El comportamiento genérico de autenticación/autorización (verificarRol, ámbito) ya existe en autenticacion-roles y no cambia; esta change agrega requisitos nuevos específicos de la gestión de usuarios como capacidad propia. -->

## Impact

- **Backend (servicios):** `src/server/servicios/usuarios.servicio.ts` — agregar validación de jerarquía y ámbito en `crear`, `actualizarPassword`, `cambiarEstado`.
- **Backend (rutas):** `src/app/api/usuarios/route.ts` y `src/app/api/usuarios/[id]/route.ts` — propagar la sesión a las validaciones y mapear errores de autorización a `403`.
- **Backend (auth):** posible reutilización/extensión de `src/server/auth/autorizacion.servicio.ts` para validación de ámbito por funcionario.
- **Datos:** lectura de `funcionario_escuela` / `escuelas.region_id` para resolver el ámbito del funcionario destino (sin cambios de esquema previstos).
- **Pruebas:** `test/e2e/usuarios.test.ts` y pruebas unitarias del servicio.
- **Frontend:** nueva pantalla de gestión de usuarios bajo el área de administración (sidebar), con SWR + formularios `useReducer`.
- **Dominio relacionado:** capability existente `autenticacion-roles`.
