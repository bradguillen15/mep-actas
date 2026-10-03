import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { and, eq, like } from "drizzle-orm";
import { hashSync } from "bcryptjs";
import { construirClave } from "../../server/almacenamiento/r2.util";
import * as esquema from "../esquema";
import {
  ACTAS,
  ESCUELAS,
  PERSONAL,
  REGIONES,
  ROLES,
  TIPOS_ACTA,
  type ActaSemilla,
  type NivelRolSemilla,
  type PersonalSemilla,
} from "./datos";

type BaseDeDatos = LibSQLDatabase<typeof esquema>;

export const PASSWORD_LOCAL = "password";

const RONDAS_HASH_PREDETERMINADAS = 10;
const PRIORIDAD_REGISTRO_POR_NIVEL: readonly NivelRolSemilla[] = [3, 4, 2, 1];

export type DatosImagenEscaneo = {
  clave: string;
  numeroTomo: number;
  numeroFolio: number;
  nombreEscuela: string;
};

export type GeneradorImagenEscaneo = (datos: DatosImagenEscaneo) => Promise<boolean>;

export type OpcionesSemilla = {
  rondasHash?: number;
  generarImagenEscaneo?: GeneradorImagenEscaneo;
};

export type UsuarioSembrado = {
  email: string;
  rol: string;
  nivel: NivelRolSemilla;
  ambito: string;
};

export type ResumenSemilla = {
  usuarios: UsuarioSembrado[];
  imagenesGeneradas: number;
};

async function primerId(
  consulta: Promise<{ id: number }[]>
): Promise<number | undefined> {
  const [fila] = await consulta;
  return fila?.id;
}

async function obtenerIdOCrear(
  buscar: () => Promise<{ id: number }[]>,
  crear: () => Promise<{ id: number }[]>
): Promise<number> {
  const existente = await primerId(buscar());
  if (existente !== undefined) return existente;
  const [nuevo] = await crear();
  return nuevo.id;
}

function exigir<T>(valor: T | undefined, descripcion: string): T {
  if (valor === undefined) {
    throw new Error(`Dato de semilla inconsistente: no existe ${descripcion}`);
  }
  return valor;
}

async function sembrarCatalogos(db: BaseDeDatos) {
  const roles = new Map<NivelRolSemilla, { id: number; nombre: string }>();
  for (const rol of ROLES) {
    const id = await obtenerIdOCrear(
      () =>
        db.select({ id: esquema.roles.id }).from(esquema.roles).where(eq(esquema.roles.nombre, rol.nombre)),
      () => db.insert(esquema.roles).values(rol).returning({ id: esquema.roles.id })
    );
    roles.set(rol.nivel, { id, nombre: rol.nombre });
  }

  const regiones = new Map<string, number>();
  for (const nombre of REGIONES) {
    regiones.set(
      nombre,
      await obtenerIdOCrear(
        () =>
          db.select({ id: esquema.regiones.id }).from(esquema.regiones).where(eq(esquema.regiones.nombre, nombre)),
        () => db.insert(esquema.regiones).values({ nombre }).returning({ id: esquema.regiones.id })
      )
    );
  }

  const tipos = new Map<string, number>();
  for (const nombre of TIPOS_ACTA) {
    tipos.set(
      nombre,
      await obtenerIdOCrear(
        () =>
          db.select({ id: esquema.tiposActas.id }).from(esquema.tiposActas).where(eq(esquema.tiposActas.nombre, nombre)),
        () => db.insert(esquema.tiposActas).values({ nombre }).returning({ id: esquema.tiposActas.id })
      )
    );
  }

  const escuelas = new Map<string, number>();
  for (const escuela of ESCUELAS) {
    const regionId = exigir(regiones.get(escuela.region), `la región ${escuela.region}`);
    escuelas.set(
      escuela.codigoMep,
      await obtenerIdOCrear(
        () =>
          db.select({ id: esquema.escuelas.id }).from(esquema.escuelas).where(eq(esquema.escuelas.codigoMep, escuela.codigoMep)),
        () =>
          db
            .insert(esquema.escuelas)
            .values({ regionId, codigoMep: escuela.codigoMep, nombre: escuela.nombre })
            .returning({ id: esquema.escuelas.id })
      )
    );
  }

  return { roles, regiones, tipos, escuelas };
}

async function obtenerIdPersona(
  db: BaseDeDatos,
  persona: { identificacion: string; nombres: string; apellidos: string }
): Promise<number> {
  return obtenerIdOCrear(
    () =>
      db
        .select({ id: esquema.personas.id })
        .from(esquema.personas)
        .where(eq(esquema.personas.identificacion, persona.identificacion)),
    () => db.insert(esquema.personas).values(persona).returning({ id: esquema.personas.id })
  );
}

async function sembrarPersonal(
  db: BaseDeDatos,
  catalogos: Awaited<ReturnType<typeof sembrarCatalogos>>,
  rondasHash: number
) {
  const funcionarios = new Map<string, number>();
  const usuarios = new Map<string, number>();
  let hashCompartido: string | undefined;

  for (const persona of PERSONAL) {
    const personaId = await obtenerIdPersona(db, persona);
    const funcionarioId = await obtenerIdOCrear(
      () =>
        db
          .select({ id: esquema.funcionarios.id })
          .from(esquema.funcionarios)
          .where(eq(esquema.funcionarios.personaId, personaId)),
      () =>
        db
          .insert(esquema.funcionarios)
          .values({ personaId, puesto: persona.puesto })
          .returning({ id: esquema.funcionarios.id })
    );
    funcionarios.set(persona.identificacion, funcionarioId);

    for (const codigoMep of persona.escuelas) {
      const escuelaId = exigir(catalogos.escuelas.get(codigoMep), `la escuela ${codigoMep}`);
      await obtenerIdOCrear(
        () =>
          db
            .select({ id: esquema.funcionarioEscuela.id })
            .from(esquema.funcionarioEscuela)
            .where(
              and(
                eq(esquema.funcionarioEscuela.funcionarioId, funcionarioId),
                eq(esquema.funcionarioEscuela.escuelaId, escuelaId)
              )
            ),
        () =>
          db
            .insert(esquema.funcionarioEscuela)
            .values({ funcionarioId, escuelaId })
            .returning({ id: esquema.funcionarioEscuela.id })
      );
    }

    if (!persona.usuario) continue;
    const { email, nivel } = persona.usuario;
    const rolId = exigir(catalogos.roles.get(nivel), `el rol de nivel ${nivel}`).id;
    usuarios.set(
      email,
      await obtenerIdOCrear(
        () =>
          db.select({ id: esquema.usuarios.id }).from(esquema.usuarios).where(eq(esquema.usuarios.email, email)),
        () => {
          hashCompartido ??= hashSync(PASSWORD_LOCAL, rondasHash);
          return db
            .insert(esquema.usuarios)
            .values({ funcionarioId, rolId, email, passwordHash: hashCompartido })
            .returning({ id: esquema.usuarios.id });
        }
      )
    );
  }

  return { funcionarios, usuarios };
}

function personalDeEscuela(codigoMep: string): PersonalSemilla[] {
  return PERSONAL.filter((p) => p.escuelas.includes(codigoMep));
}

function registradorDeActa(acta: ActaSemilla): PersonalSemilla {
  const candidatos = personalDeEscuela(acta.escuela).filter((p) => p.usuario);
  for (const nivel of PRIORIDAD_REGISTRO_POR_NIVEL) {
    const encontrado = candidatos.find((p) => p.usuario?.nivel === nivel);
    if (encontrado) return encontrado;
  }
  throw new Error(`Dato de semilla inconsistente: la escuela ${acta.escuela} no tiene usuarios`);
}

async function sembrarActas(
  db: BaseDeDatos,
  catalogos: Awaited<ReturnType<typeof sembrarCatalogos>>,
  personal: Awaited<ReturnType<typeof sembrarPersonal>>,
  generarImagenEscaneo: GeneradorImagenEscaneo | undefined
): Promise<number> {
  let imagenesGeneradas = 0;
  for (const acta of ACTAS) {
    const escuelaId = exigir(catalogos.escuelas.get(acta.escuela), `la escuela ${acta.escuela}`);
    const tipoActaId = exigir(catalogos.tipos.get(acta.tipo), `el tipo de acta ${acta.tipo}`);
    const titulo = `${acta.tipo} ${acta.anio}`;
    const fecha = `${acta.anio}-12-15T00:00:00.000Z`;

    const actaId = await obtenerIdOCrear(
      () =>
        db
          .select({ id: esquema.actas.id })
          .from(esquema.actas)
          .where(
            and(
              eq(esquema.actas.escuelaId, escuelaId),
              eq(esquema.actas.tipoActaId, tipoActaId),
              eq(esquema.actas.numeroTomo, acta.numeroTomo)
            )
          ),
      () =>
        db
          .insert(esquema.actas)
          .values({
            escuelaId,
            tipoActaId,
            titulo,
            numeroTomo: acta.numeroTomo,
            folioInicio: acta.folioInicio,
            folioFin: acta.folioFin,
            fecha,
            createdAt: fecha,
          })
          .returning({ id: esquema.actas.id })
    );

    for (const [indice, graduado] of acta.estudiantes.entries()) {
      const personaId = await obtenerIdPersona(db, graduado);
      const estudianteId = await obtenerIdOCrear(
        () =>
          db
            .select({ id: esquema.estudiantes.id })
            .from(esquema.estudiantes)
            .where(eq(esquema.estudiantes.personaId, personaId)),
        () => db.insert(esquema.estudiantes).values({ personaId }).returning({ id: esquema.estudiantes.id })
      );
      await obtenerIdOCrear(
        () =>
          db
            .select({ id: esquema.actaEstudiantes.id })
            .from(esquema.actaEstudiantes)
            .where(
              and(
                eq(esquema.actaEstudiantes.actaId, actaId),
                eq(esquema.actaEstudiantes.estudianteId, estudianteId)
              )
            ),
        () =>
          db
            .insert(esquema.actaEstudiantes)
            .values({ actaId, estudianteId, numeroCertificado: acta.certificadoInicial + indice })
            .returning({ id: esquema.actaEstudiantes.id })
      );
    }

    for (const firmante of personalDeEscuela(acta.escuela).filter((p) => p.rolFirma)) {
      const funcionarioId = exigir(
        personal.funcionarios.get(firmante.identificacion),
        `el funcionario ${firmante.identificacion}`
      );
      const rolFirma = exigir(firmante.rolFirma, "el rol de firma");
      await obtenerIdOCrear(
        () =>
          db
            .select({ id: esquema.actaFirmantes.id })
            .from(esquema.actaFirmantes)
            .where(
              and(
                eq(esquema.actaFirmantes.actaId, actaId),
                eq(esquema.actaFirmantes.funcionarioId, funcionarioId),
                eq(esquema.actaFirmantes.rolFirma, rolFirma)
              )
            ),
        () =>
          db
            .insert(esquema.actaFirmantes)
            .values({ actaId, funcionarioId, rolFirma })
            .returning({ id: esquema.actaFirmantes.id })
      );
    }

    const registrador = registradorDeActa(acta);
    const usuarioId = exigir(
      personal.usuarios.get(exigir(registrador.usuario, "el usuario registrador").email),
      "el usuario registrador"
    );

    const nombreEscuela = exigir(
      ESCUELAS.find((e) => e.codigoMep === acta.escuela),
      `la escuela ${acta.escuela}`
    ).nombre;
    for (let folio = acta.folioInicio; folio <= acta.folioFin; folio++) {
      const clave = construirClave(escuelaId, acta.numeroTomo, folio, "png");
      const escaneoId = await obtenerIdOCrear(
        () =>
          db
            .select({ id: esquema.escaneos.id })
            .from(esquema.escaneos)
            .where(
              and(
                eq(esquema.escaneos.escuelaId, escuelaId),
                eq(esquema.escaneos.numeroTomo, acta.numeroTomo),
                eq(esquema.escaneos.numeroFolio, folio)
              )
            ),
        () =>
          db
            .insert(esquema.escaneos)
            .values({
              escuelaId,
              numeroTomo: acta.numeroTomo,
              numeroFolio: folio,
              url: clave,
              formato: "png",
              uploadedBy: usuarioId,
              createdAt: fecha,
            })
            .returning({ id: esquema.escaneos.id })
      );
      await db
        .update(esquema.escaneos)
        .set({ url: clave, formato: "png" })
        .where(
          and(eq(esquema.escaneos.id, escaneoId), like(esquema.escaneos.url, "escaneos/%/tomo-%"))
        );
      if (generarImagenEscaneo) {
        const generada = await generarImagenEscaneo({
          clave,
          numeroTomo: acta.numeroTomo,
          numeroFolio: folio,
          nombreEscuela,
        });
        if (generada) imagenesGeneradas++;
      }
      await obtenerIdOCrear(
        () =>
          db
            .select({ id: esquema.actaEscaneos.id })
            .from(esquema.actaEscaneos)
            .where(
              and(eq(esquema.actaEscaneos.actaId, actaId), eq(esquema.actaEscaneos.escaneoId, escaneoId))
            ),
        () =>
          db.insert(esquema.actaEscaneos).values({ actaId, escaneoId }).returning({ id: esquema.actaEscaneos.id })
      );
    }

    const regionId = exigir(
      catalogos.regiones.get(
        exigir(ESCUELAS.find((e) => e.codigoMep === acta.escuela), `la escuela ${acta.escuela}`).region
      ),
      "la región de la escuela"
    );
    await obtenerIdOCrear(
      () =>
        db
          .select({ id: esquema.auditoria.id })
          .from(esquema.auditoria)
          .where(
            and(
              eq(esquema.auditoria.usuarioId, usuarioId),
              eq(esquema.auditoria.tabla, "actas"),
              eq(esquema.auditoria.registroId, actaId),
              eq(esquema.auditoria.accion, "crear")
            )
          ),
      () =>
        db
          .insert(esquema.auditoria)
          .values({
            usuarioId,
            tabla: "actas",
            registroId: actaId,
            accion: "crear",
            datosAnteriores: null,
            datosNuevos: JSON.stringify({ titulo, numeroTomo: acta.numeroTomo }),
            escuelaId,
            regionId,
            createdAt: fecha,
          })
          .returning({ id: esquema.auditoria.id })
    );
  }
  return imagenesGeneradas;
}

function describirAmbito(persona: PersonalSemilla): string {
  if (persona.usuario?.nivel === 1) return "todo el país";
  const escuelas = persona.escuelas
    .map((codigo) => ESCUELAS.find((e) => e.codigoMep === codigo))
    .filter((e): e is NonNullable<typeof e> => e !== undefined);
  if (persona.usuario?.nivel === 2) {
    return [...new Set(escuelas.map((e) => e.region))].join(", ");
  }
  return escuelas.map((e) => e.nombre).join(", ");
}

export async function sembrarBaseDeDatos(
  db: BaseDeDatos,
  opciones: OpcionesSemilla = {}
): Promise<ResumenSemilla> {
  const catalogos = await sembrarCatalogos(db);
  const personal = await sembrarPersonal(
    db,
    catalogos,
    opciones.rondasHash ?? RONDAS_HASH_PREDETERMINADAS
  );
  const imagenesGeneradas = await sembrarActas(
    db,
    catalogos,
    personal,
    opciones.generarImagenEscaneo
  );

  const usuarios = PERSONAL.flatMap((persona): UsuarioSembrado[] =>
    persona.usuario
      ? [
          {
            email: persona.usuario.email,
            rol: exigir(catalogos.roles.get(persona.usuario.nivel), "el rol").nombre,
            nivel: persona.usuario.nivel,
            ambito: describirAmbito(persona),
          },
        ]
      : []
  );

  return { usuarios, imagenesGeneradas };
}

