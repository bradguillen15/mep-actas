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
