import type {
  ParametrosBusquedaGraduaciones,
  ResultadoBusquedaGraduaciones,
  ResultadoGraduacion,
} from "@/server/repositorios/graduaciones.repositorio";

export type GraduacionDto = {
  id: number;
  nombreCompleto: string;
  identificacion: string;
  escuela: string;
  tipoActa: string;
  fecha: string;
  numeroCertificado: number;
  actaId: number;
  tituloActa: string;
};

type RepositorioGraduaciones = {
  buscarGraduaciones: (
    params: ParametrosBusquedaGraduaciones
  ) => Promise<ResultadoBusquedaGraduaciones>;
  obtenerGraduacionPorId: (id: number) => Promise<ResultadoGraduacion[]>;
};

export type RespuestaBusquedaGraduaciones = {
  datos: GraduacionDto[];
  total: number;
  pagina: number;
  limite: number;
};

export type ServicioGraduaciones = {
  buscar: (
    params: ParametrosBusquedaGraduaciones
  ) => Promise<RespuestaBusquedaGraduaciones>;
  obtenerPorId: (id: number) => Promise<{
    acta: GraduacionDto[];
  }>;
};

function mapearGraduacion(resultado: ResultadoGraduacion): GraduacionDto {
  return {
    id: resultado.actaEstudianteId,
    nombreCompleto: `${resultado.nombres} ${resultado.apellidos}`,
    identificacion: resultado.identificacion,
    escuela: resultado.escuelaNombre,
    tipoActa: resultado.tipoActaNombre,
    fecha: resultado.fecha,
    numeroCertificado: resultado.numeroCertificado,
    actaId: resultado.actaId,
    tituloActa: resultado.titulo,
  };
}

export function crearServicioGraduaciones(
  repositorio: RepositorioGraduaciones
): ServicioGraduaciones {
  return {
    async buscar(params) {
      const { datos, total, pagina, limite } =
        await repositorio.buscarGraduaciones(params);
      return {
        datos: datos.map(mapearGraduacion),
        total,
        pagina,
        limite,
      };
    },

    async obtenerPorId(id) {
      const resultados = await repositorio.obtenerGraduacionPorId(id);
      if (resultados.length === 0) {
        const error = new Error("Graduación no encontrada");
        error.name = "NotFoundError";
        throw error;
      }
      return { acta: resultados.map(mapearGraduacion) };
    },
  };
}
