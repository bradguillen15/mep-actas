import type { Auditor } from "./auditoria.servicio";
import type { FilaFuncionarioConPersona } from "../repositorios/funcionarios.repositorio";
import type { SesionUsuario } from "@/server/auth/tipos";

export interface RepositorioFuncionarios {
  listarFuncionarios: (filtros?: {
    escuelaId?: number;
  }) => Promise<FilaFuncionarioConPersona[]>;
  obtenerFuncionarioPorId: (
    id: number
  ) => Promise<FilaFuncionarioConPersona | undefined>;
  crearFuncionario: (datos: {
    personaId: number;
    puesto: string;
  }) => Promise<FilaFuncionarioConPersona>;
  actualizarFuncionario: (
    id: number,
    datos: { puesto?: string }
  ) => Promise<FilaFuncionarioConPersona | undefined>;
  asignarFuncionarioAEscuela: (
    funcionarioId: number,
    escuelaId: number
  ) => Promise<unknown>;
  removerFuncionarioDeEscuela: (
    funcionarioId: number,
    escuelaId: number
  ) => Promise<void>;
  listarEscuelasDeFuncionario: (
    funcionarioId: number
  ) => Promise<unknown[]>;
}

export interface ServicioFuncionarios {
  listarFuncionarios: (filtros?: {
    escuelaId?: number;
  }) => Promise<FilaFuncionarioConPersona[]>;
  obtenerFuncionarioPorId: (
    id: number
  ) => Promise<FilaFuncionarioConPersona | undefined>;
  crearFuncionario: (
    datos: { personaId: number; puesto: string },
    sesion: SesionUsuario
  ) => Promise<FilaFuncionarioConPersona>;
  actualizarFuncionario: (
    id: number,
    datos: { puesto?: string },
    sesion: SesionUsuario
  ) => Promise<FilaFuncionarioConPersona | undefined>;
  asignarFuncionarioAEscuela: (
    funcionarioId: number,
    escuelaId: number,
    sesion: SesionUsuario
  ) => Promise<{ id: number }>;
  removerFuncionarioDeEscuela: (
    funcionarioId: number,
    escuelaId: number,
    sesion: SesionUsuario
  ) => Promise<void>;
}

export function crearServicioFuncionarios(
  repositorio: RepositorioFuncionarios,
  auditor: Auditor
): ServicioFuncionarios {
  return {
    async listarFuncionarios(
      filtros?: { escuelaId?: number }
    ): Promise<FilaFuncionarioConPersona[]> {
      return repositorio.listarFuncionarios(filtros);
    },

    async obtenerFuncionarioPorId(
      id: number
    ): Promise<FilaFuncionarioConPersona | undefined> {
      return repositorio.obtenerFuncionarioPorId(id);
    },

    async crearFuncionario(
      datos: { personaId: number; puesto: string },
      sesion: SesionUsuario
    ): Promise<FilaFuncionarioConPersona> {
      if (!datos.puesto || datos.puesto.trim() === "") {
        throw new Error("El puesto no puede estar vacío");
      }

      const funcionario = await repositorio.crearFuncionario(datos);

      await auditor({
        usuarioId: sesion.usuarioId,
        tabla: "funcionarios",
        registroId: funcionario.id,
        accion: "crear",
        datosAnteriores: null,
        datosNuevos: JSON.stringify(funcionario),
      });

      return funcionario;
    },

    async actualizarFuncionario(
      id: number,
      datos: { puesto?: string },
      sesion: SesionUsuario
    ): Promise<FilaFuncionarioConPersona | undefined> {
      const anterior = await repositorio.obtenerFuncionarioPorId(id);
      if (!anterior) {
        throw new Error("Funcionario no encontrado");
      }

      const funcionario = await repositorio.actualizarFuncionario(id, datos);

      if (funcionario) {
        await auditor({
          usuarioId: sesion.usuarioId,
          tabla: "funcionarios",
          registroId: funcionario.id,
          accion: "actualizar",
          datosAnteriores: JSON.stringify(anterior),
          datosNuevos: JSON.stringify(funcionario),
        });
      }

      return funcionario;
    },

    async asignarFuncionarioAEscuela(
      funcionarioId: number,
      escuelaId: number,
      sesion: SesionUsuario
    ): Promise<{ id: number }> {
      const resultado = (await repositorio.asignarFuncionarioAEscuela(
        funcionarioId,
        escuelaId
      )) as { id: number };

      await auditor({
        usuarioId: sesion.usuarioId,
        tabla: "funcionario_escuela",
        registroId: resultado.id,
        accion: "asignar_escuela",
        datosAnteriores: null,
        datosNuevos: JSON.stringify({
          funcionarioId,
          escuelaId,
        }),
      });

      return resultado;
    },

    async removerFuncionarioDeEscuela(
      funcionarioId: number,
      escuelaId: number,
      sesion: SesionUsuario
    ): Promise<void> {
      await repositorio.removerFuncionarioDeEscuela(
        funcionarioId,
        escuelaId
      );

      await auditor({
        usuarioId: sesion.usuarioId,
        tabla: "funcionario_escuela",
        registroId: 0,
        accion: "remover_escuela",
        datosAnteriores: JSON.stringify({ funcionarioId, escuelaId }),
        datosNuevos: null,
      });
    },
  };
}
