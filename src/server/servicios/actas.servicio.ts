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
import {
  derivarAmbitoConsulta,
  type AmbitoConsulta,
} from "@/server/auth/ambito";
import { ErrorNoEncontrado } from "@/server/errores";

export type FiltrosActas = {
  escuelaId?: number;
  tipoActaId?: number;
  tomo?: number;
};

export type EstudianteDeActa = FilaActaEstudiante & {
  identificacion: string;
  nombres: string;
  apellidos: string;
};

export type FirmanteDeActa = FilaActaFirmante & {
  nombres: string;
  apellidos: string;
  puesto: string;
};

type RepositorioActas = {
  listarActas: (
    filtros: FiltrosActas,
    ambito: AmbitoConsulta
  ) => Promise<FilaActa[]>;
  obtenerActaPorId: (
    id: number,
    ambito: AmbitoConsulta
  ) => Promise<FilaActa | undefined>;
  crearActa: (datos: DatosNuevaActa) => Promise<FilaActa>;
  actualizarActa: (
    id: number,
    datos: Partial<DatosNuevaActa>
  ) => Promise<FilaActa | undefined>;
};

type RepositorioDetalle = {
  listarEstudiantesDeActa: (actaId: number) => Promise<EstudianteDeActa[]>;
  agregarEstudianteAActa: (
    actaId: number,
    personaId: number,
    numeroCertificado: number
  ) => Promise<FilaActaEstudiante>;
  listarFirmantesDeActa: (actaId: number) => Promise<FirmanteDeActa[]>;
  agregarFirmante: (
    actaId: number,
    funcionarioId: number,
    rolFirma: string
  ) => Promise<FilaActaFirmante>;
};

export type ServicioActas = {
  listarActas: (
    filtros: FiltrosActas,
    ambito: AmbitoConsulta
  ) => Promise<FilaActa[]>;
  obtenerActaPorId: (
    id: number,
    ambito: AmbitoConsulta
  ) => Promise<{
    acta: FilaActa;
    estudiantes: EstudianteDeActa[];
    firmantes: FirmanteDeActa[];
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
    actaId: number,
    ambito: AmbitoConsulta
  ) => Promise<EstudianteDeActa[]>;
  listarFirmantesDeActa: (
    actaId: number,
    ambito: AmbitoConsulta
  ) => Promise<FirmanteDeActa[]>;
};

export function crearServicioActas(
  repositorio: RepositorioActas,
  repositorioDetalle: RepositorioDetalle,
  auditor: Auditor
): ServicioActas {
  async function cargarActaEnAmbito(
    id: number,
    ambito: AmbitoConsulta
  ): Promise<FilaActa> {
    const acta = await repositorio.obtenerActaPorId(id, ambito);
    if (!acta) throw new ErrorNoEncontrado("Acta no encontrada");
    return acta;
  }

  return {
    async listarActas(filtros, ambito) {
      return repositorio.listarActas(filtros, ambito);
    },

    async obtenerActaPorId(id, ambito) {
      const acta = await cargarActaEnAmbito(id, ambito);
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
        escuelaId: acta.escuelaId,
        datosAnteriores: null,
        datosNuevos: JSON.stringify({
          titulo: datos.titulo,
          escuelaId: datos.escuelaId,
        }),
      });
      return acta;
    },

    async actualizarActa(id, datos, sesion) {
      const existente = await cargarActaEnAmbito(
        id,
        derivarAmbitoConsulta(sesion)
      );
      const acta = await repositorio.actualizarActa(id, datos);
      if (acta) {
        await auditor({
          usuarioId: sesion.usuarioId,
          tabla: "actas",
          registroId: id,
          accion: "actualizar",
          escuelaId: existente.escuelaId,
          datosAnteriores: null,
          datosNuevos: JSON.stringify(datos),
        });
      }
      return acta;
    },

    async agregarEstudiante(actaId, personaId, numeroCertificado, sesion) {
      const acta = await cargarActaEnAmbito(
        actaId,
        derivarAmbitoConsulta(sesion)
      );
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
        escuelaId: acta.escuelaId,
        datosAnteriores: null,
        datosNuevos: JSON.stringify({ personaId, numeroCertificado }),
      });
      return resultado;
    },

    async agregarFirmante(actaId, funcionarioId, rolFirma, sesion) {
      const acta = await cargarActaEnAmbito(
        actaId,
        derivarAmbitoConsulta(sesion)
      );
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
        escuelaId: acta.escuelaId,
        datosAnteriores: null,
        datosNuevos: JSON.stringify({ funcionarioId, rolFirma }),
      });
      return resultado;
    },

    async listarEstudiantesDeActa(actaId, ambito) {
      await cargarActaEnAmbito(actaId, ambito);
      return repositorioDetalle.listarEstudiantesDeActa(actaId);
    },

    async listarFirmantesDeActa(actaId, ambito) {
      await cargarActaEnAmbito(actaId, ambito);
      return repositorioDetalle.listarFirmantesDeActa(actaId);
    },
  };
}
