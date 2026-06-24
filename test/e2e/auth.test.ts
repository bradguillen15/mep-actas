import { describe, it, expect } from "vitest";
import { clienteDb } from "@/db/cliente";
import { obtenerUsuarioPorEmail } from "@/server/repositorios/usuarios.repositorio";
import { compare } from "bcryptjs";

const EMAIL = "admin-pais@e2e.test";
const PASSWORD = "test-password";

describe("Autenticación e2e", () => {
  it("obtiene usuario por email con nivel de rol", async () => {
    const db = clienteDb();
    const usuario = await obtenerUsuarioPorEmail(db, EMAIL);

    expect(usuario).toBeDefined();
    expect(usuario!.email).toBe(EMAIL);
    expect(usuario!.nivel).toBe(1);
    expect(usuario!.funcionarioId).toBeGreaterThan(0);
  });

  it("verifica contraseña con bcrypt", async () => {
    const db = clienteDb();
    const usuario = await obtenerUsuarioPorEmail(db, EMAIL);

    expect(usuario).toBeDefined();

    const valida = await compare(PASSWORD, usuario!.passwordHash);
    expect(valida).toBe(true);

    const invalida = await compare("wrong-password", usuario!.passwordHash);
    expect(invalida).toBe(false);
  });

  it("retorna undefined para email inexistente", async () => {
    const db = clienteDb();
    const usuario = await obtenerUsuarioPorEmail(db, "no-existe@e2e.test");
    expect(usuario).toBeUndefined();
  });
});
