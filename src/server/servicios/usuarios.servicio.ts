import type { Auditor } from "./auditoria.servicio";
import type {
  FilaUsuario,
  FilaUsuarioLista,
  DatosNuevoUsuario,
  AmbitoFuncionario,
} from "@/server/repositorios/usuarios.repositorio";
import type { SesionUsuario } from "@/server/auth/tipos";

type RepositorioUsuarios = {
  listarUsuarios: () => Promise<FilaUsuarioLista[]>;
  obtenerUsuarioPorId: (id: number) => Promise<FilaUsuarioLista | undefined>;
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

function errorAutorizacion(): Error {
  const error = new Error("No tiene permisos para gestionar este usuario");
  error.name = "ForbiddenError";
  return error;
}

function dentroDeAmbito(sesion: SesionUsuario, ambito: AmbitoFuncionario): boolean {
  if (sesion.nivel === 1) return true;
  if (sesion.nivel === 2) {
    return (
      sesion.regionId !== undefined && ambito.regionIds.includes(sesion.regionId)
    );
  }
  if (sesion.nivel === 3) {
    return (
      sesion.escuelaId !== undefined &&
      ambito.escuelaIds.includes(sesion.escuelaId)
    );
  }
  return false;
}

async function verificarJerarquiaYAmbito(
  repositorio: RepositorioUsuarios,
  sesion: SesionUsuario,
  nivelObjetivo: number,
  funcionarioObjetivoId: number
): Promise<void> {
  if (nivelObjetivo < sesion.nivel) {
    throw errorAutorizacion();
  }
  if (sesion.nivel === 1) return;
  const ambito = await repositorio.obtenerAmbitoDeFuncionario(
    funcionarioObjetivoId
  );
  if (!dentroDeAmbito(sesion, ambito)) {
    throw errorAutorizacion();
  }
}

export type ServicioUsuarios = {
  listar: () => Promise<FilaUsuarioLista[]>;
  obtenerPorId: (id: number) => Promise<FilaUsuarioLista>;
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
    async listar() {
      return repositorio.listarUsuarios();
    },

    async obtenerPorId(id) {
      const usuario = await repositorio.obtenerUsuarioPorId(id);
      if (!usuario) {
        const error = new Error("Usuario no encontrado");
        error.name = "NotFoundError";
        throw error;
      }
      return usuario;
    },

    async crear(datos, sesion) {
      const nivelObjetivo = await repositorio.obtenerNivelDeRol(datos.rolId);
      if (nivelObjetivo === undefined) {
        const error = new Error("El rol indicado no existe");
        error.name = "NotFoundError";
        throw error;
      }
      await verificarJerarquiaYAmbito(
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
      const objetivo = await repositorio.obtenerUsuarioPorId(id);
      if (!objetivo) {
        const error = new Error("Usuario no encontrado");
        error.name = "NotFoundError";
        throw error;
      }
      await verificarJerarquiaYAmbito(
        repositorio,
        sesion,
        objetivo.nivel,
        objetivo.funcionarioId
      );

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
      const objetivo = await repositorio.obtenerUsuarioPorId(id);
      if (!objetivo) {
        const error = new Error("Usuario no encontrado");
        error.name = "NotFoundError";
        throw error;
      }
      await verificarJerarquiaYAmbito(
        repositorio,
        sesion,
        objetivo.nivel,
        objetivo.funcionarioId
      );

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
