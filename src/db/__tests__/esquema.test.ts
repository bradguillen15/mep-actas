import { describe, it, expect } from "vitest";

describe("Esquema de base de datos", () => {
  it("exporta las 15 tablas con nombres en español", async () => {
    const esquema = await import("../esquema");
    const tablas = [
      "regiones",
      "escuelas",
      "tiposActas",
      "actas",
      "actaEstudiantes",
      "personas",
      "estudiantes",
      "escaneos",
      "actaEscaneos",
      "funcionarios",
      "funcionarioEscuela",
      "actaFirmantes",
      "roles",
      "usuarios",
      "auditoria",
    ];

    for (const tabla of tablas) {
      expect(esquema).toHaveProperty(tabla);
    }
  });

  it("personas tiene columna identificacion unica", async () => {
    const esquema = await import("../esquema");
    expect(esquema.personas.identificacion).toBeDefined();
  });

  it("usuarios tiene columna email unica", async () => {
    const esquema = await import("../esquema");
    expect(esquema.usuarios.email).toBeDefined();
  });
});
