import type { SesionUsuario, NivelRol } from "@/server/auth/tipos";
import { verificarRol } from "@/server/auth/autorizacion.servicio";
import type {
  FilaEscuela,
  DatosNuevaEscuela,
  FiltrosEscuelas,
} from "../repositorios/escuelas.repositorio";
import type { Auditor } from "./auditoria.servicio";

export interface RepositorioEscuelas {
  listarEscuelas: (filtros?: FiltrosEscuelas) => Promise<FilaEscuela[]>;
  obtenerEscuelaPorId: (id: number) => Promise<FilaEscuela | undefined>;
  crearEscuela: (
    datos: Pick<DatosNuevaEscuela, "regionId" | "codigoMep" | "nombre">
  ) => Promise<FilaEscuela>;
  actualizarEscuela: (
    id: number,
    datos: Partial<Pick<DatosNuevaEscuela, "nombre" | "codigoMep">>
  ) => Promise<FilaEscuela | undefined>;
  desactivarEscuela: (id: number) => Promise<FilaEscuela | undefined>;
  contarActasActivas: (escuelaId: number) => Promise<number>;
}

export interface ServicioEscuelas {
  listarEscuelas: (filtros?: FiltrosEscuelas) => Promise<FilaEscuela[]>;
  crearEscuela: (
    datos: { regionId: number; codigoMep: string; nombre: string },
    sesion: SesionUsuario
  ) => Promise<FilaEscuela>;
  actualizarEscuela: (
    id: number,
    datos: { nombre?: string; codigoMep?: string },
    sesion: SesionUsuario
  ) => Promise<FilaEscuela | undefined>;
  desactivarEscuela: (
    id: number,
    sesion: SesionUsuario
  ) => Promise<FilaEscuela | undefined>;
}

const NIVEL_ADMIN_REGIONAL: NivelRol = 2;

export function crearServicioEscuelas(
  repositorio: RepositorioEscuelas,
  auditor: Auditor
): ServicioEscuelas {
  return {
    async listarEscuelas(filtros?) {
      return repositorio.listarEscuelas(filtros);
    },

    async crearEscuela(datos, sesion) {
      const verificacion = verificarRol(sesion, NIVEL_ADMIN_REGIONAL, {
        regionId: datos.regionId,
      });
      if (!verificacion.autorizado) {
        throw new Error("No tiene permisos para crear escuelas en esta región");
      }

      if (!datos.codigoMep || datos.codigoMep.trim().length === 0) {
        throw new Error("El código MEP no puede estar vacío");
      }
      if (!datos.nombre || datos.nombre.trim().length === 0) {
        throw new Error("El nombre de la escuela no puede estar vacío");
      }

      const escuela = await repositorio.crearEscuela({
        regionId: datos.regionId,
        codigoMep: datos.codigoMep.trim(),
        nombre: datos.nombre.trim(),
      });

      await auditor({
        usuarioId: sesion.usuarioId,
        tabla: "escuelas",
        registroId: escuela.id,
        accion: "crear",
        datosAnteriores: null,
        datosNuevos: JSON.stringify({
          regionId: datos.regionId,
          codigoMep: datos.codigoMep,
          nombre: datos.nombre,
        }),
      });

      return escuela;
    },

    async actualizarEscuela(id, datos, sesion) {
      const existente = await repositorio.obtenerEscuelaPorId(id);
      if (!existente) {
        throw new Error("Escuela no encontrada");
      }

      const verificacion = verificarRol(sesion, NIVEL_ADMIN_REGIONAL, {
        regionId: existente.regionId,
      });
      if (!verificacion.autorizado) {
        throw new Error("No tiene permisos para modificar esta escuela");
      }

      const datosAnteriores = JSON.stringify({
        nombre: existente.nombre,
        codigoMep: existente.codigoMep,
      });

      const escuela = await repositorio.actualizarEscuela(id, {
        ...(datos.nombre !== undefined && { nombre: datos.nombre.trim() }),
        ...(datos.codigoMep !== undefined && {
          codigoMep: datos.codigoMep.trim(),
        }),
      });

      await auditor({
        usuarioId: sesion.usuarioId,
        tabla: "escuelas",
        registroId: id,
        accion: "actualizar",
        datosAnteriores,
        datosNuevos: JSON.stringify({
          ...(datos.nombre !== undefined && { nombre: datos.nombre }),
          ...(datos.codigoMep !== undefined && { codigoMep: datos.codigoMep }),
        }),
      });

      return escuela;
    },

    async desactivarEscuela(id, sesion) {
      const existente = await repositorio.obtenerEscuelaPorId(id);
      if (!existente) {
        throw new Error("Escuela no encontrada");
      }

      const verificacion = verificarRol(sesion, NIVEL_ADMIN_REGIONAL, {
        regionId: existente.regionId,
      });
      if (!verificacion.autorizado) {
        throw new Error("No tiene permisos para desactivar esta escuela");
      }

      const actasActivas = await repositorio.contarActasActivas(id);
      if (actasActivas > 0) {
        throw new Error(
          "No se puede desactivar una escuela con actas activas"
        );
      }

      const escuela = await repositorio.desactivarEscuela(id);

      await auditor({
        usuarioId: sesion.usuarioId,
        tabla: "escuelas",
        registroId: id,
        accion: "desactivar",
        datosAnteriores: JSON.stringify({ activo: existente.activo }),
        datosNuevos: JSON.stringify({ activo: false }),
      });

      return escuela;
    },
  };
}
