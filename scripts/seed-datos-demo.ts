import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { eq, like, sql } from "drizzle-orm";
import * as esquema from "../src/db/esquema";
import path from "path";

const PREFIJO_ACTA = "DEMO - ";

const GRADUADOS = [
  { identificacion: "101230001", nombres: "Juan", apellidos: "Pérez López" },
  { identificacion: "101230002", nombres: "María", apellidos: "González Ruiz" },
  { identificacion: "101230003", nombres: "Carlos", apellidos: "Mendoza Solano" },
  { identificacion: "101230004", nombres: "Ana", apellidos: "Cordero Víquez" },
  { identificacion: "108760001", nombres: "Laura", apellidos: "Rodríguez Vargas" },
  { identificacion: "108760002", nombres: "Diego", apellidos: "Jiménez Castro" },
  { identificacion: "108760003", nombres: "Sofía", apellidos: "Fernández Mora" },
  { identificacion: "108760004", nombres: "Andrés", apellidos: "Rojas Chaves" },
  { identificacion: "108760005", nombres: "Valeria", apellidos: "Solís Quesada" },
  { identificacion: "108760006", nombres: "Gabriel", apellidos: "Araya Brenes" },
  { identificacion: "108760007", nombres: "Camila", apellidos: "Herrera Umaña" },
  { identificacion: "108760008", nombres: "Daniel", apellidos: "Vargas Picado" },
  { identificacion: "108760009", nombres: "Isabella", apellidos: "Castro Ramírez" },
  { identificacion: "108760010", nombres: "Mateo", apellidos: "Mora Salazar" },
  { identificacion: "108760011", nombres: "Natalia", apellidos: "Chaves Zamora" },
  { identificacion: "108760012", nombres: "Sebastián", apellidos: "Quesada Alfaro" },
  { identificacion: "108760013", nombres: "Paula", apellidos: "Brenes Navarro" },
  { identificacion: "108760014", nombres: "Emilio", apellidos: "Umaña Sibaja" },
  { identificacion: "108760015", nombres: "Daniela", apellidos: "Picado Leiva" },
  { identificacion: "108760016", nombres: "Tomás", apellidos: "Ramírez Obando" },
  { identificacion: "108760017", nombres: "Lucía", apellidos: "Salazar Porras" },
  { identificacion: "108760018", nombres: "Felipe", apellidos: "Zamora Carvajal" },
  { identificacion: "108760019", nombres: "Elena", apellidos: "Alfaro Quirós" },
  { identificacion: "108760020", nombres: "Ricardo", apellidos: "Navarro Fallas" },
  { identificacion: "108760021", nombres: "Andrea", apellidos: "Sibaja Campos" },
  { identificacion: "108760022", nombres: "Javier", apellidos: "Leiva Arce" },
  { identificacion: "108760023", nombres: "Mariana", apellidos: "Obando Loría" },
  { identificacion: "108760024", nombres: "Óscar", apellidos: "Porras Madrigal" },
  { identificacion: "108760025", nombres: "Gabriela", apellidos: "Carvajal Esquivel" },
  { identificacion: "108760026", nombres: "Héctor", apellidos: "Quirós Madrigal" },
  { identificacion: "108760027", nombres: "Claudia", apellidos: "Fallas Rojas" },
  { identificacion: "108760028", nombres: "Mauricio", apellidos: "Campos Vega" },
  { identificacion: "108760029", nombres: "Patricia", apellidos: "Arce Montero" },
  { identificacion: "108760030", nombres: "Roberto", apellidos: "Loría Segura" },
  { identificacion: "108760031", nombres: "Verónica", apellidos: "Madrigal Arias" },
  { identificacion: "108760032", nombres: "Eduardo", apellidos: "Esquivel Bolaños" },
  { identificacion: "108760033", nombres: "Silvia", apellidos: "Vega Chacón" },
  { identificacion: "108760034", nombres: "Francisco", apellidos: "Montero Gamboa" },
  { identificacion: "108760035", nombres: "Karla", apellidos: "Segura Monge" },
  { identificacion: "108760036", nombres: "Alejandro", apellidos: "Arias Granados" },
  { identificacion: "108760037", nombres: "Jimena", apellidos: "Bolaños Ulloa" },
  { identificacion: "108760038", nombres: "Iván", apellidos: "Chacón Venegas" },
  { identificacion: "108760039", nombres: "Rebeca", apellidos: "Gamboa Zúñiga" },
  { identificacion: "108760040", nombres: "Pablo", apellidos: "Monge Céspedes" },
  { identificacion: "108760041", nombres: "Adriana", apellidos: "Granados Murillo" },
  { identificacion: "108760042", nombres: "Sergio", apellidos: "Ulloa Piedra" },
  { identificacion: "108760043", nombres: "Estefanía", apellidos: "Venegas Agüero" },
  { identificacion: "108760044", nombres: "Raúl", apellidos: "Zúñiga Badilla" },
  { identificacion: "108760045", nombres: "Mónica", apellidos: "Céspedes Fonseca" },
  { identificacion: "108760046", nombres: "Luis", apellidos: "Murillo Sánchez" },
  { identificacion: "108760047", nombres: "Carmen", apellidos: "Piedra Valerio" },
  { identificacion: "108760048", nombres: "José", apellidos: "Agüero Delgado" },
  { identificacion: "108760049", nombres: "Rosa", apellidos: "Badilla Guzmán" },
  { identificacion: "108760050", nombres: "Miguel", apellidos: "Fonseca Acosta" },
] as const;

type ActaDemo = {
  escuelaId: number;
  anio: number;
  numeroTomo: number;
  folioInicio: number;
  folioFin: number;
  graduados: (typeof GRADUADOS)[number][];
};

const ACTAS_DEMO: ActaDemo[] = [
  {
    escuelaId: 1,
    anio: 2020,
    numeroTomo: 12,
    folioInicio: 1,
    folioFin: 18,
    graduados: GRADUADOS.slice(0, 12),
  },
  {
    escuelaId: 1,
    anio: 2022,
    numeroTomo: 14,
    folioInicio: 1,
    folioFin: 15,
    graduados: GRADUADOS.slice(12, 24),
  },
  {
    escuelaId: 1,
    anio: 2024,
    numeroTomo: 16,
    folioInicio: 1,
    folioFin: 14,
    graduados: GRADUADOS.slice(24, 35),
  },
  {
    escuelaId: 2,
    anio: 2021,
    numeroTomo: 8,
    folioInicio: 1,
    folioFin: 12,
    graduados: GRADUADOS.slice(35, 44),
  },
  {
    escuelaId: 2,
    anio: 2023,
    numeroTomo: 9,
    folioInicio: 1,
    folioFin: 10,
    graduados: GRADUADOS.slice(44, 50),
  },
  {
    escuelaId: 3,
    anio: 2022,
    numeroTomo: 5,
    folioInicio: 1,
    folioFin: 8,
    graduados: [
      GRADUADOS[0],
      GRADUADOS[4],
      GRADUADOS[8],
      GRADUADOS[12],
      GRADUADOS[16],
      GRADUADOS[20],
      GRADUADOS[24],
      GRADUADOS[28],
    ],
  },
];

function resolverRutaDb(): string {
  const url = process.env.TURSO_DATABASE_URL;
  if (url?.startsWith("file:")) {
    return url.replace(/^file:/, "");
  }
  return path.resolve(__dirname, "../mep-actas-local.db");
}

async function eliminarDatosDemo(
  db: ReturnType<typeof drizzle<typeof esquema>>
) {
  const actasDemo = await db
    .select({ id: esquema.actas.id })
    .from(esquema.actas)
    .where(like(esquema.actas.titulo, `${PREFIJO_ACTA}%`));

  for (const acta of actasDemo) {
    await db
      .delete(esquema.actaEstudiantes)
      .where(eq(esquema.actaEstudiantes.actaId, acta.id));
    await db.delete(esquema.actas).where(eq(esquema.actas.id, acta.id));
  }
}

async function obtenerOCrearPersona(
  db: ReturnType<typeof drizzle<typeof esquema>>,
  graduado: (typeof GRADUADOS)[number]
): Promise<number> {
  const [existente] = await db
    .select({ id: esquema.personas.id })
    .from(esquema.personas)
    .where(eq(esquema.personas.identificacion, graduado.identificacion));

  if (existente) {
    return existente.id;
  }

  const [nueva] = await db
    .insert(esquema.personas)
    .values(graduado)
    .returning({ id: esquema.personas.id })
    .all();

  return nueva.id;
}

async function obtenerOCrearEstudiante(
  db: ReturnType<typeof drizzle<typeof esquema>>,
  personaId: number
): Promise<number> {
  const [existente] = await db
    .select({ id: esquema.estudiantes.id })
    .from(esquema.estudiantes)
    .where(eq(esquema.estudiantes.personaId, personaId));

  if (existente) {
    return existente.id;
  }

  const [nuevo] = await db
    .insert(esquema.estudiantes)
    .values({ personaId })
    .returning({ id: esquema.estudiantes.id })
    .all();

  return nuevo.id;
}

async function main() {
  const forzar = process.argv.includes("--force");
  const rutaDb = resolverRutaDb();
  const client = createClient({ url: `file:${rutaDb}` });
  const db = drizzle(client, { schema: esquema });

  await migrate(db, {
    migrationsFolder: path.resolve(__dirname, "../drizzle"),
  });

  const [{ cnt }] = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(esquema.actas)
    .where(like(esquema.actas.titulo, `${PREFIJO_ACTA}%`));

  if (cnt > 0 && !forzar) {
    console.log(
      `Ya existen ${cnt} actas de demo. Use --force para regenerarlas.`
    );
    client.close();
    return;
  }

  if (forzar && cnt > 0) {
    await eliminarDatosDemo(db);
    console.log("  actas de demo anteriores eliminadas");
  }

  const [tipoGraduacion] = await db
    .select({ id: esquema.tiposActas.id })
    .from(esquema.tiposActas)
    .where(eq(esquema.tiposActas.nombre, "Certificado de Graduación"))
    .limit(1);

  if (!tipoGraduacion) {
    throw new Error(
      "No se encontró el tipo de acta 'Certificado de Graduación'. Ejecute primero pnpm db:init-local"
    );
  }

  let numeroCertificado = 10001;
  let totalGraduados = 0;

  for (const actaDemo of ACTAS_DEMO) {
    const [{ id: actaId }] = await db
      .insert(esquema.actas)
      .values({
        escuelaId: actaDemo.escuelaId,
        tipoActaId: tipoGraduacion.id,
        titulo: `${PREFIJO_ACTA}Graduación ${actaDemo.anio}`,
        numeroTomo: actaDemo.numeroTomo,
        folioInicio: actaDemo.folioInicio,
        folioFin: actaDemo.folioFin,
        fecha: `${actaDemo.anio}-12-15T00:00:00.000Z`,
      })
      .returning({ id: esquema.actas.id })
      .all();

    for (const graduado of actaDemo.graduados) {
      const personaId = await obtenerOCrearPersona(db, graduado);
      const estudianteId = await obtenerOCrearEstudiante(db, personaId);

      await db.insert(esquema.actaEstudiantes).values({
        actaId,
        estudianteId,
        numeroCertificado: numeroCertificado++,
      });

      totalGraduados++;
    }
  }

  client.close();

  console.log(`\nDatos de demo insertados en: ${rutaDb}`);
  console.log(`  ${ACTAS_DEMO.length} actas de graduación`);
  console.log(`  ${totalGraduados} registros de graduados (con repeticiones entre actas)`);
  console.log(`  ${GRADUADOS.length} personas únicas`);
  console.log("\nEjemplos para probar el buscador:");
  console.log("  Cédula: 108760001  → Laura Rodríguez Vargas");
  console.log("  Cédula: 101230002  → María González Ruiz");
  console.log("  Nombre: Rodríguez  → varios resultados");
  console.log("  Nombre: González   → varios resultados");
  console.log("  Escuela: Escuela Central (id 1) con filtro de escuela");
}

main().catch((err) => {
  console.error("Error al insertar datos de demo:", err);
  process.exit(1);
});
