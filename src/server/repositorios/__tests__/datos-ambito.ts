import * as esquema from "@/db/esquema";
import type { DbEnMemoria } from "./db-en-memoria";

/*
 * Escenario compartido: región 1 (escuelas 10 y 11) y región 2 (escuela 20).
 * Personas: 1 estudiante en acta de la 10; 2 firmante (funcionario 2) de acta de la 20 sin asignación;
 * 3 funcionario 3 asignado a la 11; 4 sin vínculo; 5 estudiante en actas de la 10 y la 20;
 * 6 funcionario 6 asignado a la 10 y la 20.
 */
export async function sembrarEscenarioDeAmbito(db: DbEnMemoria) {
  await db.insert(esquema.regiones).values([
    { id: 1, nombre: "Región Uno" },
    { id: 2, nombre: "Región Dos" },
  ]);
  await db.insert(esquema.escuelas).values([
    { id: 10, regionId: 1, codigoMep: "E10", nombre: "Escuela 10" },
    { id: 11, regionId: 1, codigoMep: "E11", nombre: "Escuela 11" },
    { id: 20, regionId: 2, codigoMep: "E20", nombre: "Escuela 20" },
  ]);
  await db.insert(esquema.tiposActas).values({ id: 1, nombre: "Bachillerato" });
  await db.insert(esquema.actas).values(
    [10, 20].map((escuelaId) => ({
      id: escuelaId,
      escuelaId,
      tipoActaId: 1,
      titulo: `Acta ${escuelaId}`,
      numeroTomo: 1,
      folioInicio: 1,
      folioFin: 2,
      fecha: "2025-12-01",
    }))
  );
  await db.insert(esquema.personas).values(
    [1, 2, 3, 4, 5, 6].map((id) => ({
      id,
      identificacion: `20000000${id}`,
      nombres: `Persona ${id}`,
      apellidos: id % 2 === 0 ? "Mora" : "Solano",
    }))
  );
  await db.insert(esquema.estudiantes).values([
    { id: 1, personaId: 1 },
    { id: 5, personaId: 5 },
  ]);
  await db.insert(esquema.actaEstudiantes).values([
    { actaId: 10, estudianteId: 1, numeroCertificado: 1 },
    { actaId: 10, estudianteId: 5, numeroCertificado: 2 },
    { actaId: 20, estudianteId: 5, numeroCertificado: 3 },
  ]);
  await db.insert(esquema.funcionarios).values([
    { id: 2, personaId: 2, puesto: "Director" },
    { id: 3, personaId: 3, puesto: "Docente" },
    { id: 6, personaId: 6, puesto: "Supervisor" },
  ]);
  await db.insert(esquema.actaFirmantes).values({
    actaId: 20,
    funcionarioId: 2,
    rolFirma: "Director",
  });
  await db.insert(esquema.funcionarioEscuela).values([
    { funcionarioId: 3, escuelaId: 11 },
    { funcionarioId: 6, escuelaId: 10 },
    { funcionarioId: 6, escuelaId: 20 },
  ]);
}
