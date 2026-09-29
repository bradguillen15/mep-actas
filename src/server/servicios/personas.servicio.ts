import type { Auditor } from "./auditoria.servicio";
import type {
  FilaPersona,
  DatosNuevaPersona,
  PersonaMinima,
} from "../repositorios/personas.repositorio";
import type { SesionUsuario } from "@/server/auth/tipos";

export interface RepositorioPersonas {
  listarPersonas: (busqueda?: string) => Promise<FilaPersona[]>;
  obtenerPersonaPorId: (id: number) => Promise<FilaPersona | undefined>;
  obtenerPersonaPorIdentificacion: (
    identificacion: string
  ) => Promise<FilaPersona | undefined>;
  obtenerPersonaMinimaPorIdentificacion: (
    identificacion: string
  ) => Promise<PersonaMinima | undefined>;
  crearPersona: (datos: DatosNuevaPersona) => Promise<FilaPersona>;
  actualizarPersona: (
    id: number,
    datos: Partial<DatosNuevaPersona>
  ) => Promise<FilaPersona | undefined>;
}

export interface ServicioPersonas {
  listarPersonas: (busqueda?: string) => Promise<FilaPersona[]>;
  obtenerPersonaPorId: (id: number) => Promise<FilaPersona | undefined>;
  buscarPersonaPorIdentificacionExacta: (
    identificacion: string
  ) => Promise<PersonaMinima[]>;
  crearPersona: (
    datos: DatosNuevaPersona,
    sesion: SesionUsuario
  ) => Promise<FilaPersona>;
  actualizarPersona: (
    id: number,
    datos: Partial<DatosNuevaPersona>,
    sesion: SesionUsuario
  ) => Promise<FilaPersona | undefined>;
}

export function crearServicioPersonas(
  repositorio: RepositorioPersonas,
  auditor: Auditor
): ServicioPersonas {
  return {
    async listarPersonas(busqueda?: string) {
      return repositorio.listarPersonas(busqueda);
    },

    async obtenerPersonaPorId(id: number) {
      return repositorio.obtenerPersonaPorId(id);
    },

    async buscarPersonaPorIdentificacionExacta(identificacion) {
      const persona =
        await repositorio.obtenerPersonaMinimaPorIdentificacion(identificacion);
      return persona ? [persona] : [];
    },

    async crearPersona(
      datos: DatosNuevaPersona,
      sesion: SesionUsuario
    ): Promise<FilaPersona> {
      if (!datos.identificacion || datos.identificacion.trim() === "") {
        throw new Error("La identificación no puede estar vacía");
      }
      if (!datos.nombres || datos.nombres.trim() === "") {
        throw new Error("Los nombres no pueden estar vacíos");
      }
      if (!datos.apellidos || datos.apellidos.trim() === "") {
        throw new Error("Los apellidos no pueden estar vacíos");
      }

      const existente = await repositorio.obtenerPersonaPorIdentificacion(
        datos.identificacion
      );
      if (existente) {
        throw new Error(
          `Ya existe una persona con la identificación ${datos.identificacion}`
        );
      }

      const persona = await repositorio.crearPersona(datos);

      await auditor({
        usuarioId: sesion.usuarioId,
        tabla: "personas",
        registroId: persona.id,
        accion: "crear",
        datosAnteriores: null,
        datosNuevos: JSON.stringify(persona),
      });

      return persona;
    },

    async actualizarPersona(
      id: number,
      datos: Partial<DatosNuevaPersona>,
      sesion: SesionUsuario
    ): Promise<FilaPersona | undefined> {
      if (datos.identificacion !== undefined) {
        if (!datos.identificacion.trim()) {
          throw new Error("La identificación no puede estar vacía");
        }
        const existente = await repositorio.obtenerPersonaPorIdentificacion(
          datos.identificacion
        );
        if (existente && existente.id !== id) {
          throw new Error(
            `Ya existe otra persona con la identificación ${datos.identificacion}`
          );
        }
      }

      const anterior = await repositorio.obtenerPersonaPorId(id);
      if (!anterior) {
        throw new Error("Persona no encontrada");
      }

      const persona = await repositorio.actualizarPersona(id, datos);

      if (persona) {
        await auditor({
          usuarioId: sesion.usuarioId,
          tabla: "personas",
          registroId: persona.id,
          accion: "actualizar",
          datosAnteriores: JSON.stringify(anterior),
          datosNuevos: JSON.stringify(persona),
        });
      }

      return persona;
    },
  };
}
