import type { SesionUsuario } from "@/server/auth/tipos";
import type { FilaTipoActa } from "../repositorios/tipos-acta.repositorio";
import {
  ErrorConflicto,
  ErrorNoEncontrado,
  ErrorValidacion,
} from "@/server/errores";
import type { Auditor } from "./auditoria.servicio";

export interface RepositorioTiposActa {
  listarTiposActaActivos: () => Promise<Pick<FilaTipoActa, "id" | "nombre">[]>;
  crearTipoActa: (datos: { nombre: string }) => Promise<FilaTipoActa>;
  obtenerTipoActaPorId: (id: number) => Promise<FilaTipoActa | undefined>;
  desactivarTipoActa: (id: number) => Promise<FilaTipoActa | undefined>;
  contarActasPorTipo: (tipoActaId: number) => Promise<number>;
}

export interface ServicioTiposActa {
  listarTiposActa: () => Promise<Pick<FilaTipoActa, "id" | "nombre">[]>;
  crearTipoActa: (
    datos: { nombre: string },
    sesion: SesionUsuario
  ) => Promise<FilaTipoActa>;
  desactivarTipoActa: (
    id: number,
    sesion: SesionUsuario
  ) => Promise<FilaTipoActa | undefined>;
}

export function crearServicioTiposActa(
  repositorio: RepositorioTiposActa,
  auditor: Auditor
): ServicioTiposActa {
  return {
    async listarTiposActa() {
      return repositorio.listarTiposActaActivos();
    },

    async crearTipoActa(datos, sesion) {
      if (!datos.nombre || datos.nombre.trim().length === 0) {
        throw new ErrorValidacion("El nombre es requerido");
      }

      const nombre = datos.nombre.trim();
      const tipo = await repositorio.crearTipoActa({ nombre });

      await auditor({
        usuarioId: sesion.usuarioId,
        tabla: "tipos_acta",
        registroId: tipo.id,
        accion: "crear",
        datosAnteriores: null,
        datosNuevos: JSON.stringify({ nombre }),
      });

      return tipo;
    },

    async desactivarTipoActa(id, sesion) {
      const existente = await repositorio.obtenerTipoActaPorId(id);
      if (!existente) {
        throw new ErrorNoEncontrado("Tipo de acta no encontrado");
      }

      const actasAsociadas = await repositorio.contarActasPorTipo(id);
      if (actasAsociadas > 0) {
        throw new ErrorConflicto(
          "No se puede eliminar un tipo de acta con actas asociadas"
        );
      }

      const tipo = await repositorio.desactivarTipoActa(id);

      await auditor({
        usuarioId: sesion.usuarioId,
        tabla: "tipos_acta",
        registroId: id,
        accion: "desactivar",
        datosAnteriores: JSON.stringify({
          nombre: existente.nombre,
          activo: existente.activo,
        }),
        datosNuevos: JSON.stringify({ activo: false }),
      });

      return tipo;
    },
  };
}
