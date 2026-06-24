import type { Auditor } from "./auditoria.servicio";
import type {
  FilaUsuario,
  FilaUsuarioLista,
  DatosNuevoUsuario,
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
};

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
