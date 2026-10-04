import { describe, it, expect, vi } from "vitest";

vi.mock("../r2.util", () => ({
  construirClave: vi.fn(),
  generarUrlLectura: vi.fn(async (clave: string) => `https://r2.example/${clave}`),
  generarUrlSubida: vi.fn(async (clave: string) => `https://r2.example/subida/${clave}`),
}));

import { modoLocalActivo, crearAlmacenamientoEscaneos } from "../seleccion";

const R2_CONFIGURADO = {
  R2_ACCOUNT_ID: "cuenta",
  R2_ACCESS_KEY_ID: "llave",
  R2_SECRET_ACCESS_KEY: "secreto",
};

describe("modoLocalActivo", () => {
  it("se activa en desarrollo sin variables de R2", () => {
    expect(modoLocalActivo({ NODE_ENV: "development" })).toBe(true);
  });

  it("no se activa en desarrollo con R2 configurado", () => {
    expect(modoLocalActivo({ NODE_ENV: "development", ...R2_CONFIGURADO })).toBe(false);
  });

  it("se activa en desarrollo si R2 está incompleto", () => {
    expect(
      modoLocalActivo({ NODE_ENV: "development", R2_ACCOUNT_ID: "cuenta" })
    ).toBe(true);
  });

  it.each(["production", "test", undefined])(
    "no se activa con NODE_ENV=%s aunque falte R2",
    (entorno) => {
      expect(modoLocalActivo({ NODE_ENV: entorno })).toBe(false);
    }
  );
});

describe("crearAlmacenamientoEscaneos", () => {
  it("usa el adaptador local en desarrollo sin R2", async () => {
    const almacenamiento = crearAlmacenamientoEscaneos({ NODE_ENV: "development" });
    expect(await almacenamiento.generarUrlLectura("escaneos/1/1/1.png")).toBe(
      "/api/almacenamiento-local/escaneos/1/1/1.png"
    );
  });

  it("usa R2 en desarrollo con R2 configurado", async () => {
    const almacenamiento = crearAlmacenamientoEscaneos({
      NODE_ENV: "development",
      ...R2_CONFIGURADO,
    });
    expect(await almacenamiento.generarUrlLectura("escaneos/1/1/1.png")).toBe(
      "https://r2.example/escaneos/1/1/1.png"
    );
  });

  it("usa R2 en producción", async () => {
    const almacenamiento = crearAlmacenamientoEscaneos({ NODE_ENV: "production" });
    expect(await almacenamiento.generarUrlSubida("escaneos/1/1/1.png", "image/png")).toBe(
      "https://r2.example/subida/escaneos/1/1/1.png"
    );
  });
});

describe("producción sin variables de R2", () => {
  it("el adaptador R2 sigue lanzando error por variables faltantes", async () => {
    vi.doUnmock("../r2.util");
    vi.resetModules();
    const { crearAlmacenamientoEscaneos: crear } = await import("../seleccion");
    const entornoAnterior = { ...process.env };
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    try {
      const almacenamiento = crear({ NODE_ENV: "production" });
      await expect(almacenamiento.generarUrlLectura("escaneos/1/1/1.png")).rejects.toThrow(
        /R2_ACCOUNT_ID/
      );
    } finally {
      process.env = entornoAnterior;
    }
  });
});
