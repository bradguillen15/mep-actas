import type {
  FilaAuditoriaLista,
  FiltrosAuditoria,
} from "@/server/repositorios/auditoria.repositorio";
import type { AmbitoConsulta } from "@/server/auth/ambito";

type RepositorioAuditoria = {
  listarAuditoria: (
    filtros: FiltrosAuditoria,
    ambito: AmbitoConsulta
  ) => Promise<FilaAuditoriaLista[]>;
};

export type ServicioAuditoria = {
  listar: (
    filtros: FiltrosAuditoria,
    ambito: AmbitoConsulta
  ) => Promise<FilaAuditoriaLista[]>;
};

export function crearServicioAuditoria(
  repositorio: RepositorioAuditoria
): ServicioAuditoria {
  return {
    async listar(filtros, ambito) {
      return repositorio.listarAuditoria(filtros, ambito);
    },
  };
}
