import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as esquema from "@/db/esquema";
import { crearAuditor } from "./auditoria.servicio";
import {
  crearServicioFuncionarios,
  type ServicioFuncionarios,
} from "./funcionarios.servicio";
import * as repositorio from "@/server/repositorios/funcionarios.repositorio";

export function crearServicioFuncionariosDesdeDb(
  db: LibSQLDatabase<typeof esquema>
): ServicioFuncionarios {
  return crearServicioFuncionarios(
    {
      listarFuncionarios: (filtros, ambito) =>
        repositorio.listarFuncionarios(db, filtros, ambito),
      obtenerFuncionarioPorId: (id, ambito) =>
        repositorio.obtenerFuncionarioPorId(db, id, ambito),
      crearFuncionario: (datos) => repositorio.crearFuncionario(db, datos),
      actualizarFuncionario: (id, datos) =>
        repositorio.actualizarFuncionario(db, id, datos),
      asignarFuncionarioAEscuela: (funcionarioId, escuelaId) =>
        repositorio.asignarFuncionarioAEscuela(db, funcionarioId, escuelaId),
      removerFuncionarioDeEscuela: (funcionarioId, escuelaId) =>
        repositorio.removerFuncionarioDeEscuela(db, funcionarioId, escuelaId),
      listarEscuelasDeFuncionario: (funcionarioId) =>
        repositorio.listarEscuelasDeFuncionario(db, funcionarioId),
    },
    crearAuditor(db)
  );
}
