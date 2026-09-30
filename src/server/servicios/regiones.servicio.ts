import type { SesionUsuario } from "@/server/auth/tipos";
import type {
  FilaRegion,
  DatosNuevaRegion,
} from "../repositorios/regiones.repositorio";
import type { Auditor } from "./auditoria.servicio";

export interface RepositorioRegiones {
  listarRegiones: () => Promise<FilaRegion[]>;
  obtenerRegionPorId: (id: number) => Promise<FilaRegion | undefined>;
  crearRegion: (
    datos: Pick<DatosNuevaRegion, "nombre">
  ) => Promise<FilaRegion>;
  actualizarRegion: (
    id: number,
    datos: Partial<Pick<DatosNuevaRegion, "nombre">>
  ) => Promise<FilaRegion | undefined>;
  desactivarRegion: (id: number) => Promise<FilaRegion | undefined>;
  contarEscuelasActivas: (regionId: number) => Promise<number>;
}

export interface ServicioRegiones {
  listarRegiones: () => Promise<FilaRegion[]>;
  crearRegion: (
    datos: { nombre: string },
    sesion: SesionUsuario
  ) => Promise<FilaRegion>;
  actualizarRegion: (
    id: number,
    datos: { nombre: string },
    sesion: SesionUsuario
  ) => Promise<FilaRegion | undefined>;
  desactivarRegion: (
    id: number,
    sesion: SesionUsuario
  ) => Promise<FilaRegion | undefined>;
}

export function crearServicioRegiones(
  repositorio: RepositorioRegiones,
  auditor: Auditor
): ServicioRegiones {
  return {
    async listarRegiones() {
      return repositorio.listarRegiones();
    },

    async crearRegion(datos, sesion) {
      if (!datos.nombre || datos.nombre.trim().length === 0) {
        throw new Error("El nombre de la región no puede estar vacío");
      }

      const region = await repositorio.crearRegion({
        nombre: datos.nombre.trim(),
      });

      await auditor({
        usuarioId: sesion.usuarioId,
        tabla: "regiones",
        registroId: region.id,
        accion: "crear",
        datosAnteriores: null,
        datosNuevos: JSON.stringify({ nombre: datos.nombre }),
      });

      return region;
    },

    async actualizarRegion(id, datos, sesion) {
      const existente = await repositorio.obtenerRegionPorId(id);
      if (!existente) {
        throw new Error("Región no encontrada");
      }

      if (!datos.nombre || datos.nombre.trim().length === 0) {
        throw new Error("El nombre de la región no puede estar vacío");
      }

      const datosAnteriores = JSON.stringify({ nombre: existente.nombre });

      const region = await repositorio.actualizarRegion(id, {
        nombre: datos.nombre.trim(),
      });

      await auditor({
        usuarioId: sesion.usuarioId,
        tabla: "regiones",
        registroId: id,
        accion: "actualizar",
        regionId: id,
        datosAnteriores,
        datosNuevos: JSON.stringify({ nombre: datos.nombre }),
      });

      return region;
    },

    async desactivarRegion(id, sesion) {
      const existente = await repositorio.obtenerRegionPorId(id);
      if (!existente) {
        throw new Error("Región no encontrada");
      }

      const escuelasActivas = await repositorio.contarEscuelasActivas(id);
      if (escuelasActivas > 0) {
        throw new Error(
          "No se puede desactivar una región con escuelas activas"
        );
      }

      const region = await repositorio.desactivarRegion(id);

      await auditor({
        usuarioId: sesion.usuarioId,
        tabla: "regiones",
        registroId: id,
        accion: "desactivar",
        regionId: id,
        datosAnteriores: JSON.stringify({ activo: existente.activo }),
        datosNuevos: JSON.stringify({ activo: false }),
      });

      return region;
    },
  };
}
