import type { FilaAuditoriaLista } from "@/server/repositorios/auditoria.repositorio";

type RepositorioAuditoria = {
  listarAuditoria: (filtros: {
    usuarioId?: number;
    tabla?: string;
    accion?: string;
    limite?: number;
  }) => Promise<FilaAuditoriaLista[]>;
};

export type ServicioAuditoria = {
  listar: (filtros: {
    usuarioId?: number;
    tabla?: string;
    accion?: string;
    limite?: number;
  }) => Promise<FilaAuditoriaLista[]>;
};

export function crearServicioAuditoria(
  repositorio: RepositorioAuditoria
): ServicioAuditoria {
  return {
    async listar(filtros) {
      return repositorio.listarAuditoria(filtros);
    },
  };
}
