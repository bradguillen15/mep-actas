import type { Auditor } from "./auditoria.servicio";
import type {
  DatosNuevaActa,
  FilaActa,
} from "@/server/repositorios/actas.repositorio";
import type {
  FilaActaEstudiante,
  FilaActaFirmante,
} from "@/server/repositorios/actas.detalle.repositorio";
import type { SesionUsuario } from "@/server/auth/tipos";

type RepositorioActas = {
  listarActas: (filtros: {
    escuelaId?: number;
    tipoActaId?: number;
    tomo?: number;
  }) => Promise<FilaActa[]>;
  obtenerActaPorId: (id: number) => Promise<FilaActa | undefined>;
  crearActa: (datos: DatosNuevaActa) => Promise<FilaActa>;
  actualizarActa: (
    id: number,
    datos: Partial<DatosNuevaActa>
  ) => Promise<FilaActa | undefined>;
};

type RepositorioDetalle = {
  listarEstudiantesDeActa: (
    actaId: number
  ) => Promise<
    (FilaActaEstudiante & {
      identificacion: string;
      nombres: string;
      apellidos: string;
    })[]
  >;
  agregarEstudianteAActa: (
    actaId: number,
    personaId: number,
    numeroCertificado: number
  ) => Promise<FilaActaEstudiante>;
  listarFirmantesDeActa: (
    actaId: number
  ) => Promise<
    (FilaActaFirmante & {
      nombres: string;
      apellidos: string;
      puesto: string;
    })[]
  >;
  agregarFirmante: (
    actaId: number,
    funcionarioId: number,
    rolFirma: string
  ) => Promise<FilaActaFirmante>;
};

export type ServicioActas = {
  listarActas: (filtros: {
    escuelaId?: number;
    tipoActaId?: number;
    tomo?: number;
  }) => Promise<FilaActa[]>;
  obtenerActaPorId: (
    id: number
  ) => Promise<{
    acta: FilaActa;
    estudiantes: (FilaActaEstudiante & {
      identificacion: string;
      nombres: string;
      apellidos: string;
    })[];
    firmantes: (FilaActaFirmante & {
      nombres: string;
      apellidos: string;
      puesto: string;
    })[];
  }>;
  crearActa: (
    datos: DatosNuevaActa,
    sesion: SesionUsuario
  ) => Promise<FilaActa>;
  actualizarActa: (
    id: number,
    datos: Partial<DatosNuevaActa>,
    sesion: SesionUsuario
  ) => Promise<FilaActa | undefined>;
  agregarEstudiante: (
    actaId: number,
    personaId: number,
    numeroCertificado: number,
    sesion: SesionUsuario
  ) => Promise<FilaActaEstudiante>;
  agregarFirmante: (
    actaId: number,
    funcionarioId: number,
    rolFirma: string,
    sesion: SesionUsuario
  ) => Promise<FilaActaFirmante>;
  listarEstudiantesDeActa: (
    actaId: number
  ) => Promise<
    (FilaActaEstudiante & {
      identificacion: string;
      nombres: string;
      apellidos: string;
    })[]
  >;
  listarFirmantesDeActa: (
    actaId: number
  ) => Promise<
    (FilaActaFirmante & {
      nombres: string;
      apellidos: string;
      puesto: string;
    })[]
  >;
};

export function crearServicioActas(
  repositorio: RepositorioActas,
  repositorioDetalle: RepositorioDetalle,
  auditor: Auditor
): ServicioActas {
  return {
    async listarActas(filtros) {
      return repositorio.listarActas(filtros);
    },

    async obtenerActaPorId(id) {
      const acta = await repositorio.obtenerActaPorId(id);
      if (!acta) {
        const error = new Error("Acta no encontrada");
        error.name = "NotFoundError";
        throw error;
      }
      const [estudiantes, firmantes] = await Promise.all([
        repositorioDetalle.listarEstudiantesDeActa(id),
        repositorioDetalle.listarFirmantesDeActa(id),
      ]);
      return { acta, estudiantes, firmantes };
    },

    async crearActa(datos, sesion) {
      const acta = await repositorio.crearActa(datos);
      await auditor({
        usuarioId: sesion.usuarioId,
        tabla: "actas",
        registroId: acta.id,
        accion: "crear",
        datosAnteriores: null,
        datosNuevos: JSON.stringify({
          titulo: datos.titulo,
          escuelaId: datos.escuelaId,
        }),
      });
      return acta;
    },

    async actualizarActa(id, datos, sesion) {
      const acta = await repositorio.actualizarActa(id, datos);
      if (acta) {
        await auditor({
          usuarioId: sesion.usuarioId,
          tabla: "actas",
          registroId: id,
          accion: "actualizar",
          datosAnteriores: null,
          datosNuevos: JSON.stringify(datos),
        });
      }
      return acta;
    },

    async agregarEstudiante(actaId, personaId, numeroCertificado, sesion) {
      const resultado = await repositorioDetalle.agregarEstudianteAActa(
        actaId,
        personaId,
        numeroCertificado
      );
      await auditor({
        usuarioId: sesion.usuarioId,
        tabla: "acta_estudiantes",
        registroId: resultado.id,
        accion: "agregar_estudiante",
        datosAnteriores: null,
        datosNuevos: JSON.stringify({ personaId, numeroCertificado }),
      });
      return resultado;
    },

    async agregarFirmante(actaId, funcionarioId, rolFirma, sesion) {
      const resultado = await repositorioDetalle.agregarFirmante(
        actaId,
        funcionarioId,
        rolFirma
      );
      await auditor({
        usuarioId: sesion.usuarioId,
        tabla: "acta_firmantes",
        registroId: resultado.id,
        accion: "agregar_firmante",
        datosAnteriores: null,
        datosNuevos: JSON.stringify({ funcionarioId, rolFirma }),
      });
      return resultado;
    },

    async listarEstudiantesDeActa(actaId) {
      return repositorioDetalle.listarEstudiantesDeActa(actaId);
    },

    async listarFirmantesDeActa(actaId) {
      return repositorioDetalle.listarFirmantesDeActa(actaId);
    },
  };
}
