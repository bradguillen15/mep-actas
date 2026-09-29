import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as esquema from "@/db/esquema";
import { crearAuditor } from "./auditoria.servicio";
import { crearServicioUsuarios, type ServicioUsuarios } from "./usuarios.servicio";
import * as repositorio from "@/server/repositorios/usuarios.repositorio";

export function crearServicioUsuariosDesdeDb(
  db: LibSQLDatabase<typeof esquema>
): ServicioUsuarios {
  return crearServicioUsuarios(
    {
      listarUsuarios: (ambito) => repositorio.listarUsuarios(db, ambito),
      obtenerUsuarioPorId: (id, ambito) =>
        repositorio.obtenerUsuarioPorId(db, id, ambito),
      obtenerUsuarioPorEmail: (email) =>
        repositorio.obtenerUsuarioPorEmail(db, email),
      crearUsuario: (datos) => repositorio.crearUsuario(db, datos),
      actualizarPassword: (id, passwordHash) =>
        repositorio.actualizarPassword(db, id, passwordHash),
      cambiarEstadoUsuario: (id, activo) =>
        repositorio.cambiarEstadoUsuario(db, id, activo),
      obtenerNivelDeRol: (rolId) => repositorio.obtenerNivelDeRol(db, rolId),
      obtenerAmbitoDeFuncionario: (funcionarioId) =>
        repositorio.obtenerAmbitoDeFuncionario(db, funcionarioId),
    },
    crearAuditor(db)
  );
}
