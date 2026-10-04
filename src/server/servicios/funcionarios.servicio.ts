import type { Auditor } from "./auditoria.servicio";
import type { FilaFuncionarioConPersona } from "../repositorios/funcionarios.repositorio";
import type { SesionUsuario } from "@/server/auth/tipos";
import { derivarAmbitoConsulta, type AmbitoConsulta } from "@/server/auth/ambito";
import { ErrorNoEncontrado, ErrorValidacion } from "@/server/errores";

export type FiltrosFuncionarios = { escuelaId?: number };

export interface RepositorioFuncionarios {
  listarFuncionarios: (
    filtros: FiltrosFuncionarios | undefined,
    ambito: AmbitoConsulta
  ) => Promise<FilaFuncionarioConPersona[]>;
  obtenerFuncionarioPorId: (
    id: number,
    ambito: AmbitoConsulta
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
  listarFuncionarios: (
    filtros: FiltrosFuncionarios | undefined,
    ambito: AmbitoConsulta
  ) => Promise<FilaFuncionarioConPersona[]>;
  obtenerFuncionarioPorId: (
    id: number,
    ambito: AmbitoConsulta
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
    async listarFuncionarios(filtros, ambito) {
      return repositorio.listarFuncionarios(filtros, ambito);
    },

    async obtenerFuncionarioPorId(id, ambito) {
      return repositorio.obtenerFuncionarioPorId(id, ambito);
    },

    async crearFuncionario(
      datos: { personaId: number; puesto: string },
      sesion: SesionUsuario
    ): Promise<FilaFuncionarioConPersona> {
      if (!datos.puesto || datos.puesto.trim() === "") {
        throw new ErrorValidacion("El puesto no puede estar vacío");
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
      const anterior = await repositorio.obtenerFuncionarioPorId(
        id,
        derivarAmbitoConsulta(sesion)
      );
      if (!anterior) {
        throw new ErrorNoEncontrado("Funcionario no encontrado");
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
        escuelaId,
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
        escuelaId,
        datosAnteriores: JSON.stringify({ funcionarioId, escuelaId }),
        datosNuevos: null,
      });
    },
  };
}
