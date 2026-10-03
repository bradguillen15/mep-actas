import type { Auditor } from "./auditoria.servicio";
import type { FilaEscaneo } from "../repositorios/escaneos.repositorio";
import { construirClave } from "../almacenamiento/r2.util";
import type { AlmacenamientoEscaneos } from "../almacenamiento/puerto";
import { tipoContenidoDeExtension } from "@/lib/escaneos";
import type { SesionUsuario } from "@/server/auth/tipos";
import { derivarAmbitoConsulta, type AmbitoConsulta } from "@/server/auth/ambito";
import { ErrorNoEncontrado } from "@/server/errores";

export type FiltrosEscaneos = { escuelaId?: number; tomo?: number };

export interface RepositorioEscaneos {
  listarEscaneos: (
    filtros: FiltrosEscaneos,
    ambito: AmbitoConsulta
  ) => Promise<FilaEscaneo[]>;
  obtenerEscaneoPorId: (
    id: number,
    ambito: AmbitoConsulta
  ) => Promise<FilaEscaneo | undefined>;
  obtenerEscaneoPorEscuelaTomoFolio: (
    escuelaId: number,
    numeroTomo: number,
    numeroFolio: number
  ) => Promise<FilaEscaneo | undefined>;
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
  listarEscaneos: (
    filtros: FiltrosEscaneos,
    ambito: AmbitoConsulta
  ) => Promise<FilaEscaneo[]>;
  listarConUrlLectura: (
    filtros: FiltrosEscaneos,
    ambito: AmbitoConsulta
  ) => Promise<(FilaEscaneo & { urlLectura: string })[]>;
  obtenerEscaneoPorId: (
    id: number,
    ambito: AmbitoConsulta
  ) => Promise<FilaEscaneo | undefined>;
  prepararSubida: (
    datos: {
      escuelaId: number;
      numeroTomo: number;
      numeroFolio: number;
      formato: string;
    },
    sesion: SesionUsuario
  ) => Promise<{ urlSubida: string; clave: string; escaneo: FilaEscaneo }>;
  generarUrlLectura: (
    id: number,
    ambito: AmbitoConsulta
  ) => Promise<string | undefined>;
  eliminarEscaneo: (
    id: number,
    sesion: SesionUsuario
  ) => Promise<FilaEscaneo | undefined>;
}

const EXTENSIONES_PERMITIDAS = ["jpg", "jpeg", "png", "pdf"];

export function crearServicioEscaneos(
  repositorio: RepositorioEscaneos,
  auditor: Auditor,
  almacenamiento: AlmacenamientoEscaneos
): ServicioEscaneos {
  return {
    async listarEscaneos(filtros, ambito) {
      return repositorio.listarEscaneos(filtros, ambito);
    },

    async listarConUrlLectura(filtros, ambito) {
      const escaneos = await repositorio.listarEscaneos(filtros, ambito);
      return Promise.all(
        escaneos.map(async (escaneo) => ({
          ...escaneo,
          urlLectura: await almacenamiento.generarUrlLectura(escaneo.url),
        }))
      );
    },

    async obtenerEscaneoPorId(id, ambito) {
      return repositorio.obtenerEscaneoPorId(id, ambito);
    },

    async prepararSubida(datos, sesion) {
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

      const existente = await repositorio.obtenerEscaneoPorEscuelaTomoFolio(
        datos.escuelaId,
        datos.numeroTomo,
        datos.numeroFolio
      );

      const escaneo =
        existente ??
        (await repositorio.crearEscaneo({
          escuelaId: datos.escuelaId,
          numeroTomo: datos.numeroTomo,
          numeroFolio: datos.numeroFolio,
          url: clave,
          formato: datos.formato,
          uploadedBy: sesion.usuarioId,
        }));

      const urlSubida = await almacenamiento.generarUrlSubida(
        clave,
        tipoContenidoDeExtension(ext)
      );

      if (!existente) {
        await auditor({
          usuarioId: sesion.usuarioId,
          tabla: "escaneos",
          registroId: escaneo.id,
          accion: "subir",
          escuelaId: escaneo.escuelaId,
          datosAnteriores: null,
          datosNuevos: JSON.stringify(escaneo),
        });
      }

      return { urlSubida, clave, escaneo };
    },

    async generarUrlLectura(id, ambito) {
      const escaneo = await repositorio.obtenerEscaneoPorId(id, ambito);
      if (!escaneo) return undefined;

      return almacenamiento.generarUrlLectura(escaneo.url);
    },

    async eliminarEscaneo(id, sesion) {
      const existente = await repositorio.obtenerEscaneoPorId(
        id,
        derivarAmbitoConsulta(sesion)
      );
      if (!existente) throw new ErrorNoEncontrado("Escaneo no encontrado");

      const escaneo = await repositorio.eliminarEscaneo(id);

      if (escaneo) {
        await auditor({
          usuarioId: sesion.usuarioId,
          tabla: "escaneos",
          registroId: escaneo.id,
          accion: "eliminar",
          escuelaId: existente.escuelaId,
          datosAnteriores: JSON.stringify(escaneo),
          datosNuevos: null,
        });
      }

      return escaneo;
    },
  };
}
