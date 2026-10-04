import { describe, it, expect, afterEach } from "vitest";

describe("Cliente de base de datos", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("lanza error si falta TURSO_DATABASE_URL", async () => {
    delete process.env.TURSO_DATABASE_URL;
    await expect(async () => {
      const { clienteDb } = await import("../cliente");
      clienteDb();
    }).rejects.toThrow("TURSO_DATABASE_URL");
  });
});
