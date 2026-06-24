import { describe, it, expect, vi } from "vitest";

describe("insertarRegistroAuditoria", () => {
  it("llama a db.insert con los datos correctos", async () => {
    const mockInsert = vi.fn().mockReturnThis();
    const mockValues = vi.fn().mockResolvedValue(undefined);

    const mockDb = {
      insert: mockInsert,
      values: mockValues,
    };

    const { insertarRegistroAuditoria } = await import(
      "../auditoria.repositorio"
    );

    await insertarRegistroAuditoria(mockDb as never, {
      usuarioId: 1,
      tabla: "actas",
      registroId: 10,
      accion: "crear",
      datosAnteriores: null,
      datosNuevos: JSON.stringify({ titulo: "Acta 2025" }),
      createdAt: new Date().toISOString(),
    });

    expect(mockInsert).toHaveBeenCalled();
  });
});
