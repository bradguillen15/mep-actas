import type { Auditor } from "./auditoria.servicio";
import type { FilaEscaneo } from "../repositorios/escaneos.repositorio";
import { construirClave, generarUrlSubida, generarUrlLectura } from "../almacenamiento/r2.util";
import type { SesionUsuario } from "@/server/auth/tipos";

export interface RepositorioEscaneos {
  listarEscaneos: (filtros: {
    escuelaId?: number;
    tomo?: number;
  }) => Promise<FilaEscaneo[]>;
  obtenerEscaneoPorId: (id: number) => Promise<FilaEscaneo | undefined>;
  crearEscaneo: (datos: {
    escuelaId: number;
    numeroTomo: number;
    numeroFolio: number;
    url: string;
    formato: string;
    uploadedBy: number;
  }) => Promise<FilaEscaneo>;
  eliminarEscaneo: (id: number) => Promise<FilaEscaneo | undefined>;
}

export interface ServicioEscaneos {
  listarEscaneos: (filtros: {
    escuelaId?: number;
    tomo?: number;
  }) => Promise<FilaEscaneo[]>;
  listarConUrlLectura: (filtros: {
    escuelaId?: number;
    tomo?: number;
  }) => Promise<(FilaEscaneo & { urlLectura: string })[]>;
  obtenerEscaneoPorId: (id: number) => Promise<FilaEscaneo | undefined>;
  prepararSubida: (
    datos: { escuelaId: number; numeroTomo: number; numeroFolio: number; formato: string },
    sesion: SesionUsuario
  ) => Promise<{ urlSubida: string; clave: string; escaneo: FilaEscaneo }>;
  generarUrlLectura: (id: number) => Promise<string | undefined>;
  eliminarEscaneo: (
    id: number,
    sesion: SesionUsuario
  ) => Promise<FilaEscaneo | undefined>;
}

const EXTENSIONES_PERMITIDAS = ["jpg", "jpeg", "png", "pdf"];

export function crearServicioEscaneos(
  repositorio: RepositorioEscaneos,
  auditor: Auditor
): ServicioEscaneos {
  return {
    async listarEscaneos(filtros) {
      return repositorio.listarEscaneos(filtros);
    },

    async listarConUrlLectura(filtros) {
      const escaneos = await repositorio.listarEscaneos(filtros);
      return Promise.all(
        escaneos.map(async (escaneo) => ({
          ...escaneo,
          urlLectura: await generarUrlLectura(escaneo.url),
        }))
      );
    },

    async obtenerEscaneoPorId(id) {
      return repositorio.obtenerEscaneoPorId(id);
    },

    async prepararSubida(
      datos: {
        escuelaId: number;
        numeroTomo: number;
        numeroFolio: number;
        formato: string;
      },
      sesion: SesionUsuario
    ) {
      const ext = datos.formato.toLowerCase();
      if (!EXTENSIONES_PERMITIDAS.includes(ext)) {
        throw new Error(
          `Formato no permitido: ${datos.formato}. Use: ${EXTENSIONES_PERMITIDAS.join(", ")}`
        );
      }

      const clave = construirClave(
        datos.escuelaId,
        datos.numeroTomo,
        datos.numeroFolio,
        ext
      );

      const escaneo = await repositorio.crearEscaneo({
        escuelaId: datos.escuelaId,
        numeroTomo: datos.numeroTomo,
        numeroFolio: datos.numeroFolio,
        url: clave,
        formato: datos.formato,
        uploadedBy: sesion.usuarioId,
      });

      const urlSubida = await generarUrlSubida(clave, `image/${ext === "pdf" ? "pdf" : ext}`);

      await auditor({
        usuarioId: sesion.usuarioId,
        tabla: "escaneos",
        registroId: escaneo.id,
        accion: "subir",
        datosAnteriores: null,
        datosNuevos: JSON.stringify(escaneo),
      });

      return { urlSubida, clave, escaneo };
    },

    async generarUrlLectura(id: number) {
      const escaneo = await repositorio.obtenerEscaneoPorId(id);
      if (!escaneo) return undefined;

      return generarUrlLectura(escaneo.url);
    },

    async eliminarEscaneo(id, sesion) {
      const escaneo = await repositorio.eliminarEscaneo(id);

      if (escaneo) {
        await auditor({
          usuarioId: sesion.usuarioId,
          tabla: "escaneos",
          registroId: escaneo.id,
          accion: "eliminar",
          datosAnteriores: JSON.stringify(escaneo),
          datosNuevos: null,
        });
      }

      return escaneo;
    },
  };
}
