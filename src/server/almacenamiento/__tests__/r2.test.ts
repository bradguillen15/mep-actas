import { describe, it, expect } from "vitest";

describe("construirClave", () => {
  it("genera clave con convencion escaneos/{escuela}/{tomo}/{folio}.{ext}", async () => {
    const { construirClave } = await import("../r2.util");
    const clave = construirClave(5, 3, 12, "jpg");
    expect(clave).toBe("escaneos/5/3/12.jpg");
  });

  it("normaliza la extension a minusculas", async () => {
    const { construirClave } = await import("../r2.util");
    const clave = construirClave(5, 3, 12, "JPG");
    expect(clave).toBe("escaneos/5/3/12.jpg");
  });

  it("rechaza path traversal en tomo", async () => {
    const { construirClave } = await import("../r2.util");
    expect(() => construirClave(5, -1, 12, "jpg")).toThrow();
  });

  it("rechaza extension no permitida", async () => {
    const { construirClave } = await import("../r2.util");
    expect(() => construirClave(5, 3, 12, "exe")).toThrow();
  });
});

describe("cliente R2", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("lanza error si faltan variables de entorno de R2", async () => {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;

    await expect(async () => {
      const { crearClienteR2 } = await import("../r2.cliente");
      crearClienteR2();
    }).rejects.toThrow("R2_");
  });
});
