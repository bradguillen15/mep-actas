import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { clienteDb } from "@/db/cliente";
import { crearServicioPersonasDesdeDb } from "@/server/servicios/personas.fabrica";
import { crearAuditor } from "@/server/servicios/auditoria.servicio";
import { crearServicioFuncionariosDesdeDb } from "@/server/servicios/funcionarios.fabrica";
import { crearServicioRegiones } from "@/server/servicios/regiones.servicio";
import * as repositorioRegiones from "@/server/repositorios/regiones.repositorio";
import { datosSesionAdminPais, obtenerRolPorNivel, obtenerUsuarioPorEmail } from "./helpers";
import { eq } from "drizzle-orm";
import * as esquema from "@/db/esquema";
import type { SesionUsuario } from "@/server/auth/tipos";

const idsRegion: number[] = [];
const idsEscuela: number[] = [];
const idsPersona: number[] = [];
const idsFuncionario: number[] = [];
let sesion: SesionUsuario;

beforeAll(async () => {
  const db = clienteDb();
  const rol = await obtenerRolPorNivel(db, 1);
  const usuario = await obtenerUsuarioPorEmail(db, "admin-pais@e2e.test");
  sesion = datosSesionAdminPais(usuario.id, rol.id);
});

afterAll(async () => {
  const db = clienteDb();
  for (const id of idsFuncionario) {
    await db
      .delete(esquema.funcionarioEscuela)
      .where(eq(esquema.funcionarioEscuela.funcionarioId, id));
    await db.delete(esquema.funcionarios).where(eq(esquema.funcionarios.id, id));
  }
  for (const id of idsPersona) {
    await db.delete(esquema.personas).where(eq(esquema.personas.id, id));
  }
  for (const id of idsEscuela) {
    await db.delete(esquema.escuelas).where(eq(esquema.escuelas.id, id));
  }
  for (const id of idsRegion) {
    await db.delete(esquema.regiones).where(eq(esquema.regiones.id, id));
  }
});

describe("Funcionarios e2e", () => {
  const identificacionUnica = `E2E-FUNC-${Date.now()}`;
  let personaId = 0;

  it("crea funcionario asociado a una persona", async () => {
    const db = clienteDb();
    const servicioPersonas = crearServicioPersonasDesdeDb(db);

    const persona = await servicioPersonas.crearPersona(
      {
        identificacion: identificacionUnica,
        nombres: "E2E Func Nombre",
        apellidos: "E2E Func Apellido",
      },
      sesion
    );
    idsPersona.push(persona.id);
    personaId = persona.id;

    const servicio = crearServicioFuncionariosDesdeDb(db);

    const funcionario = await servicio.crearFuncionario(
      { personaId: persona.id, puesto: "Director" },
      sesion
    );
    expect(funcionario.id).toBeGreaterThan(0);
    expect(funcionario.puesto).toBe("Director");
    expect(funcionario.identificacion).toBe(identificacionUnica);
    expect(funcionario.nombres).toBe("E2E Func Nombre");
    expect(funcionario.apellidos).toBe("E2E Func Apellido");
    idsFuncionario.push(funcionario.id);

    const listado = await servicio.listarFuncionarios(undefined, { tipo: "pais" });
    expect(listado.some((f) => f.id === funcionario.id)).toBe(true);
  });

  it("asigna funcionario a una escuela", async () => {
    const db = clienteDb();
    const auditor = crearAuditor(db);

    const servicioRegion = crearServicioRegiones(
      {
        listarRegiones: () => repositorioRegiones.listarRegiones(db),
        obtenerRegionPorId: (id) => repositorioRegiones.obtenerRegionPorId(db, id),
        crearRegion: (datos) => repositorioRegiones.crearRegion(db, datos),
        actualizarRegion: (id, datos) =>
          repositorioRegiones.actualizarRegion(db, id, datos),
        desactivarRegion: (id) => repositorioRegiones.desactivarRegion(db, id),
        contarEscuelasActivas: (id) =>
          repositorioRegiones.contarEscuelasActivas(db, id),
      },
      auditor
    );

    const region = await servicioRegion.crearRegion(
      { nombre: "E2E Región Funcionarios" },
      sesion
    );
    idsRegion.push(region.id);

    const [escuela] = await db
      .insert(esquema.escuelas)
      .values({
        regionId: region.id,
        codigoMep: "E2E-FUNC-001",
        nombre: "E2E Escuela Funcionarios",
      })
      .returning()
      .all();
    idsEscuela.push(escuela.id);

    const servicio = crearServicioFuncionariosDesdeDb(db);

    const funcionario = await servicio.crearFuncionario(
      { personaId: personaId || 1, puesto: "Profesor" },
      sesion
    );
    idsFuncionario.push(funcionario.id);

    const asignacion = await servicio.asignarFuncionarioAEscuela(
      funcionario.id,
      escuela.id,
      sesion
    );
    expect(asignacion).toBeDefined();

    const filtrados = await servicio.listarFuncionarios(
      { escuelaId: escuela.id },
      { tipo: "pais" }
    );
    expect(filtrados.some((f) => f.id === funcionario.id)).toBe(true);
  });
});
