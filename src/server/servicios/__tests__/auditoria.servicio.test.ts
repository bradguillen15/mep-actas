import { describe, it, expect, vi } from "vitest";

describe("crearAuditor", () => {
  it("registra auditoria con timestamp", async () => {
    const mockInsert = vi.fn().mockReturnThis();
    const mockValues = vi.fn().mockResolvedValue(undefined);

    const mockDb = {
      insert: mockInsert,
      values: mockValues,
    };

    const { crearAuditor } = await import("../auditoria.servicio");
    const auditar = crearAuditor(mockDb as never);

    await auditar({
      usuarioId: 1,
      tabla: "actas",
      registroId: 10,
      accion: "crear",
      datosAnteriores: null,
      datosNuevos: JSON.stringify({ titulo: "Acta 2025" }),
    });

    expect(mockInsert).toHaveBeenCalled();
  });
});
