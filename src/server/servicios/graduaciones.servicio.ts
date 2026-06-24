import type { ResultadoGraduacion } from "@/server/repositorios/graduaciones.repositorio";

type RepositorioGraduaciones = {
  buscarGraduaciones: (params: {
    identificacion?: string;
    nombre?: string;
    escuelaId?: number;
  }) => Promise<ResultadoGraduacion[]>;
  obtenerGraduacionPorId: (id: number) => Promise<ResultadoGraduacion[]>;
};

export type ServicioGraduaciones = {
  buscar: (params: {
    identificacion?: string;
    nombre?: string;
    escuelaId?: number;
  }) => Promise<ResultadoGraduacion[]>;
  obtenerPorId: (id: number) => Promise<{
    acta: ResultadoGraduacion[];
  }>;
};

export function crearServicioGraduaciones(
  repositorio: RepositorioGraduaciones
): ServicioGraduaciones {
  return {
    async buscar(params) {
      if (!params.identificacion && !params.nombre) {
        return [];
      }
      return repositorio.buscarGraduaciones(params);
    },

    async obtenerPorId(id) {
      const resultados = await repositorio.obtenerGraduacionPorId(id);
      if (resultados.length === 0) {
        const error = new Error("Graduación no encontrada");
        error.name = "NotFoundError";
        throw error;
      }
      return { acta: resultados };
    },
  };
}
