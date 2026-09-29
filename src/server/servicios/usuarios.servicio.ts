import type { Auditor } from "./auditoria.servicio";
import type {
  FilaUsuario,
  FilaUsuarioLista,
  DatosNuevoUsuario,
  AmbitoFuncionario,
} from "@/server/repositorios/usuarios.repositorio";
import type { SesionUsuario } from "@/server/auth/tipos";
import {
  derivarAmbitoConsulta,
  escuelasDentroDeAmbito,
  type AmbitoConsulta,
} from "@/server/auth/ambito";
import { ErrorNoEncontrado, ErrorProhibido } from "@/server/errores";

type RepositorioUsuarios = {
  listarUsuarios: (ambito: AmbitoConsulta) => Promise<FilaUsuarioLista[]>;
  obtenerUsuarioPorId: (
    id: number,
    ambito: AmbitoConsulta
  ) => Promise<FilaUsuarioLista | undefined>;
  obtenerUsuarioPorEmail: (email: string) => Promise<
    | (Pick<
        FilaUsuario,
        "id" | "email" | "passwordHash" | "funcionarioId" | "rolId"
      > & {
        nivel: number;
      })
    | undefined
  >;
  crearUsuario: (datos: DatosNuevoUsuario) => Promise<FilaUsuario>;
  actualizarPassword: (id: number, passwordHash: string) => Promise<void>;
  cambiarEstadoUsuario: (
    id: number,
    activo: boolean
  ) => Promise<FilaUsuario | undefined>;
  obtenerNivelDeRol: (rolId: number) => Promise<number | undefined>;
  obtenerAmbitoDeFuncionario: (
    funcionarioId: number
  ) => Promise<AmbitoFuncionario>;
};

const MENSAJE_SIN_PERMISOS = "No tiene permisos para gestionar este usuario";
const NIVEL_MAXIMO_GESTOR = 3;

function exigirGestorDeUsuarios(sesion: SesionUsuario): void {
  if (sesion.nivel > NIVEL_MAXIMO_GESTOR) {
    throw new ErrorProhibido(MENSAJE_SIN_PERMISOS);
  }
}

async function verificarCreacionPermitida(
  repositorio: RepositorioUsuarios,
  sesion: SesionUsuario,
  nivelObjetivo: number,
  funcionarioObjetivoId: number
): Promise<void> {
  exigirGestorDeUsuarios(sesion);
  if (nivelObjetivo < sesion.nivel) {
    throw new ErrorProhibido(MENSAJE_SIN_PERMISOS);
  }
  if (sesion.nivel === 1) return;
  const ambitoFuncionario = await repositorio.obtenerAmbitoDeFuncionario(
    funcionarioObjetivoId
  );
  const permitido = escuelasDentroDeAmbito(
    derivarAmbitoConsulta(sesion),
    ambitoFuncionario.escuelaIds,
    ambitoFuncionario.regionIds
  );
  if (!permitido) {
    throw new ErrorProhibido(MENSAJE_SIN_PERMISOS);
  }
}

async function cargarDestinoGestionable(
  repositorio: RepositorioUsuarios,
  id: number,
  sesion: SesionUsuario
): Promise<FilaUsuarioLista> {
  exigirGestorDeUsuarios(sesion);
  const objetivo = await repositorio.obtenerUsuarioPorId(
    id,
    derivarAmbitoConsulta(sesion)
  );
  if (!objetivo) throw new ErrorNoEncontrado("Usuario no encontrado");
  if (objetivo.nivel < sesion.nivel) {
    throw new ErrorProhibido(MENSAJE_SIN_PERMISOS);
  }
  return objetivo;
}

export type ServicioUsuarios = {
  listar: (ambito: AmbitoConsulta) => Promise<FilaUsuarioLista[]>;
  obtenerPorId: (
    id: number,
    ambito: AmbitoConsulta
  ) => Promise<FilaUsuarioLista>;
  crear: (
    datos: DatosNuevoUsuario,
    sesion: SesionUsuario
  ) => Promise<FilaUsuario>;
  actualizarPassword: (
    id: number,
    passwordHash: string,
    sesion: SesionUsuario
  ) => Promise<void>;
  cambiarEstado: (
    id: number,
    activo: boolean,
    sesion: SesionUsuario
  ) => Promise<FilaUsuario>;
};

export function crearServicioUsuarios(
  repositorio: RepositorioUsuarios,
  auditor: Auditor
): ServicioUsuarios {
  return {
    async listar(ambito) {
      return repositorio.listarUsuarios(ambito);
    },

    async obtenerPorId(id, ambito) {
      const usuario = await repositorio.obtenerUsuarioPorId(id, ambito);
      if (!usuario) throw new ErrorNoEncontrado("Usuario no encontrado");
      return usuario;
    },

    async crear(datos, sesion) {
      const nivelObjetivo = await repositorio.obtenerNivelDeRol(datos.rolId);
      if (nivelObjetivo === undefined) {
        const error = new Error("El rol indicado no existe");
        error.name = "NotFoundError";
        throw error;
      }
      await verificarCreacionPermitida(
        repositorio,
        sesion,
        nivelObjetivo,
        datos.funcionarioId
      );

      const existente = await repositorio.obtenerUsuarioPorEmail(datos.email);
      if (existente) {
        const error = new Error("El email ya está registrado");
        error.name = "ConflictError";
        throw error;
      }
      const usuario = await repositorio.crearUsuario(datos);
      await auditor({
        usuarioId: sesion.usuarioId,
        tabla: "usuarios",
        registroId: usuario.id,
        accion: "crear",
        datosAnteriores: null,
        datosNuevos: JSON.stringify({
          email: datos.email,
          funcionarioId: datos.funcionarioId,
          rolId: datos.rolId,
        }),
      });
      return usuario;
    },

    async actualizarPassword(id, passwordHash, sesion) {
      await cargarDestinoGestionable(repositorio, id, sesion);

      await repositorio.actualizarPassword(id, passwordHash);
      await auditor({
        usuarioId: sesion.usuarioId,
        tabla: "usuarios",
        registroId: id,
        accion: "cambiar_password",
        datosAnteriores: null,
        datosNuevos: null,
      });
    },

    async cambiarEstado(id, activo, sesion) {
      await cargarDestinoGestionable(repositorio, id, sesion);

      const usuario = await repositorio.cambiarEstadoUsuario(id, activo);
      if (!usuario) {
        const error = new Error("Usuario no encontrado");
        error.name = "NotFoundError";
        throw error;
      }
      await auditor({
        usuarioId: sesion.usuarioId,
        tabla: "usuarios",
        registroId: id,
        accion: activo ? "activar" : "desactivar",
        datosAnteriores: null,
        datosNuevos: JSON.stringify({ activo }),
      });
      return usuario;
    },
  };
}
