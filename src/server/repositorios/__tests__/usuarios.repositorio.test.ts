import { describe, it, expect, vi } from "vitest";

describe("obtenerUsuarioPorEmail", () => {
  it("ejecuta SELECT con JOIN a roles", async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockFrom = vi.fn().mockReturnThis();
    const mockInnerJoin = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockReturnThis();
    const mockResult = [
      {
        id: 1,
        email: "admin@prueba.cr",
        passwordHash: "hash",
        funcionarioId: 1,
        rolId: 1,
        activo: true,
        nivel: 1,
      },
    ];
    const _mockAll = vi.fn().mockResolvedValue(mockResult);

    const mockDb = {
      select: mockSelect.mockReturnValue({
        from: mockFrom.mockReturnValue({
          innerJoin: mockInnerJoin.mockReturnValue({
            where: mockWhere.mockReturnThis(),
          }),
        }),
      }),
    };

    mockWhere.mockReturnValue(mockResult);

    const { obtenerUsuarioPorEmail } = await import("../usuarios.repositorio");

    const resultado = await obtenerUsuarioPorEmail(mockDb as never, "admin@prueba.cr");

    expect(resultado?.email).toBe("admin@prueba.cr");
    expect(resultado?.nivel).toBe(1);
    expect(resultado?.activo).toBe(true);
  });

  it("retorna undefined si el email no existe", async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockFrom = vi.fn().mockReturnThis();
    const mockInnerJoin = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockReturnThis();

    const mockDb = {
      select: mockSelect.mockReturnValue({
        from: mockFrom.mockReturnValue({
          innerJoin: mockInnerJoin.mockReturnValue({
            where: mockWhere.mockReturnThis(),
          }),
        }),
      }),
    };

    mockWhere.mockReturnValue([]);

    const { obtenerUsuarioPorEmail } = await import("../usuarios.repositorio");

    const resultado = await obtenerUsuarioPorEmail(mockDb as never, "no-existe@prueba.cr");

    expect(resultado).toBeUndefined();
  });
});

describe("usuarios con ámbito (SQLite en memoria)", () => {
  async function prepararDb() {
    const { crearDbEnMemoria } = await import("./db-en-memoria");
    const { sembrarEscenarioDeAmbito } = await import("./datos-ambito");
    const esquema = await import("@/db/esquema");
    const db = await crearDbEnMemoria();
    await sembrarEscenarioDeAmbito(db);
    await db.insert(esquema.roles).values({ id: 4, nombre: "Staff", nivel: 4 });
    await db.insert(esquema.usuarios).values([
      { id: 2, funcionarioId: 2, rolId: 4, email: "sin-escuela@e2e.test", passwordHash: "h" },
      { id: 3, funcionarioId: 3, rolId: 4, email: "escuela-11@e2e.test", passwordHash: "h" },
      { id: 6, funcionarioId: 6, rolId: 4, email: "multi@e2e.test", passwordHash: "h" },
    ]);
    return db;
  }

  it("filtra el listado por el ámbito sin duplicar usuarios multi-escuela", async () => {
    const db = await prepararDb();
    const { listarUsuarios } = await import("../usuarios.repositorio");
    const ids = async (ambito: Parameters<typeof listarUsuarios>[1]) =>
      (await listarUsuarios(db, ambito)).map((u) => u.id).sort((a, b) => a - b);

    expect(await ids({ tipo: "pais" })).toEqual([2, 3, 6]);
    expect(await ids({ tipo: "region", regionId: 1 })).toEqual([3, 6]);
    expect(await ids({ tipo: "escuela", escuelaId: 20 })).toEqual([6]);
  });

  it("no obtiene por id un usuario fuera del ámbito", async () => {
    const db = await prepararDb();
    const { obtenerUsuarioPorId } = await import("../usuarios.repositorio");
    expect(await obtenerUsuarioPorId(db, 3, { tipo: "region", regionId: 2 })).toBeUndefined();
    expect(await obtenerUsuarioPorId(db, 3, { tipo: "region", regionId: 1 })).toBeDefined();
  });
});
