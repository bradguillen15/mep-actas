import type { SesionUsuario } from "@/server/auth/tipos";
import type { FilaTipoActa } from "../repositorios/tipos-acta.repositorio";
import type { Auditor } from "./auditoria.servicio";

export interface RepositorioTiposActa {
  obtenerTipoActaPorId: (id: number) => Promise<FilaTipoActa | undefined>;
  desactivarTipoActa: (id: number) => Promise<FilaTipoActa | undefined>;
  contarActasPorTipo: (tipoActaId: number) => Promise<number>;
}

export interface ServicioTiposActa {
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
    async desactivarTipoActa(id, sesion) {
      const existente = await repositorio.obtenerTipoActaPorId(id);
      if (!existente) {
        throw new Error("Tipo de acta no encontrado");
      }

      const actasAsociadas = await repositorio.contarActasPorTipo(id);
      if (actasAsociadas > 0) {
        throw new Error(
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
