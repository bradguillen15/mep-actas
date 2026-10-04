import type {
  ParametrosBusquedaGraduaciones,
  ResultadoBusquedaGraduaciones,
  ResultadoGraduacion,
} from "@/server/repositorios/graduaciones.repositorio";
import type { AmbitoConsulta } from "@/server/auth/ambito";
import { ErrorNoEncontrado } from "@/server/errores";

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
    params: ParametrosBusquedaGraduaciones,
    ambito: AmbitoConsulta
  ) => Promise<ResultadoBusquedaGraduaciones>;
  obtenerGraduacionPorId: (
    id: number,
    ambito: AmbitoConsulta
  ) => Promise<ResultadoGraduacion[]>;
};

export type RespuestaBusquedaGraduaciones = {
  datos: GraduacionDto[];
  total: number;
  pagina: number;
  limite: number;
};

export type ServicioGraduaciones = {
  buscar: (
    params: ParametrosBusquedaGraduaciones,
    ambito: AmbitoConsulta
  ) => Promise<RespuestaBusquedaGraduaciones>;
  obtenerPorId: (
    id: number,
    ambito: AmbitoConsulta
  ) => Promise<{
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
    async buscar(params, ambito) {
      const { datos, total, pagina, limite } =
        await repositorio.buscarGraduaciones(params, ambito);
      return {
        datos: datos.map(mapearGraduacion),
        total,
        pagina,
        limite,
      };
    },

    async obtenerPorId(id, ambito) {
      const resultados = await repositorio.obtenerGraduacionPorId(id, ambito);
      if (resultados.length === 0) {
        throw new ErrorNoEncontrado("Graduación no encontrada");
      }
      return { acta: resultados.map(mapearGraduacion) };
    },
  };
}
