import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { clienteDb } from "@/db/cliente";
import { crearServicioPersonasDesdeDb } from "@/server/servicios/personas.fabrica";
import { datosSesionAdminPais, obtenerRolPorNivel, obtenerUsuarioPorEmail, EMAIL_ADMIN_PAIS } from "./helpers";
import { eq } from "drizzle-orm";
import * as esquema from "@/db/esquema";
import type { SesionUsuario } from "@/server/auth/tipos";

const idsCreados: number[] = [];
let sesion: SesionUsuario;

beforeAll(async () => {
  const db = clienteDb();
  const rol = await obtenerRolPorNivel(db, 1);
  const usuario = await obtenerUsuarioPorEmail(db, EMAIL_ADMIN_PAIS);
  sesion = datosSesionAdminPais(usuario, rol.id);
});

afterAll(async () => {
  const db = clienteDb();
  for (const id of idsCreados) {
    await db.delete(esquema.personas).where(eq(esquema.personas.id, id));
  }
});

describe("Personas e2e", () => {
  const identificacionUnica = `E2E-${Date.now()}`;

  it("crea una persona", async () => {
    const db = clienteDb();
    const servicio = crearServicioPersonasDesdeDb(db);

    const persona = await servicio.crearPersona(
      {
        identificacion: identificacionUnica,
        nombres: "E2E Nombre",
        apellidos: "E2E Apellido",
      },
      sesion
    );

    expect(persona.id).toBeGreaterThan(0);
    expect(persona.identificacion).toBe(identificacionUnica);
    expect(persona.nombres).toBe("E2E Nombre");
    expect(persona.apellidos).toBe("E2E Apellido");
    idsCreados.push(persona.id);
  });

  it("rechaza identificacion duplicada", async () => {
    const db = clienteDb();
    const servicio = crearServicioPersonasDesdeDb(db);

    await expect(
      servicio.crearPersona(
        {
          identificacion: identificacionUnica,
          nombres: "E2E Duplicado",
          apellidos: "E2E Duplicado",
        },
        sesion
      )
    ).rejects.toThrow("Ya existe una persona");
  });

  it("lista personas y encuentra la creada", async () => {
    const db = clienteDb();
    const servicio = crearServicioPersonasDesdeDb(db);

    const listado = await servicio.listarPersonas(undefined, { tipo: "pais" });
    expect(listado.some((p) => p.identificacion === identificacionUnica)).toBe(
      true
    );
  });
});
