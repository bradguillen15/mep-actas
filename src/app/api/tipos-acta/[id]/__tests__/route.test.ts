import { describe, it, expect, vi, beforeEach } from "vitest";
import { ErrorConflicto } from "@/server/errores";

const mockObtenerSesion = vi.fn();
const mockDesactivarTipoActa = vi.fn();

vi.mock("@/db/cliente", () => ({ clienteDb: () => ({}) }));

vi.mock("@/server/servicios/tipos-acta.fabrica", () => ({
  crearServicioTiposActaDesdeDb: () => ({
    desactivarTipoActa: mockDesactivarTipoActa,
  }),
}));

vi.mock("@/server/auth/sesion.servicio", () => ({
  obtenerSesion: mockObtenerSesion,
}));

vi.mock("next-auth", () => ({
  default: () => ({
    auth: vi.fn(),
    handlers: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

describe("DELETE /api/tipos-acta/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 si no hay sesión", async () => {
    mockObtenerSesion.mockResolvedValue(null);

    const { DELETE } = await import("../route");
    const req = new Request("http://localhost/api/tipos-acta/1", {
      method: "DELETE",
    });
    const respuesta = await DELETE(req, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(respuesta.status).toBe(401);
  });

  it("retorna 403 si no tiene permisos (nivel=4)", async () => {
    mockObtenerSesion.mockResolvedValue({
      usuarioId: 4,
      email: "staff@escuela.go.cr",
      nivel: 4,
      rolId: 4,
      funcionarioId: 4,
      escuelaId: 1,
    });

    const { DELETE } = await import("../route");
    const req = new Request("http://localhost/api/tipos-acta/1", {
      method: "DELETE",
    });
    const respuesta = await DELETE(req, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(respuesta.status).toBe(403);
    expect(await respuesta.json()).toEqual({
      error: "No tiene permisos para realizar esta acción",
    });
  });

  it("retorna 409 ante ErrorConflicto sin inspeccionar el mensaje", async () => {
    mockObtenerSesion.mockResolvedValue({
      usuarioId: 1,
      email: "admin@pais.go.cr",
      nivel: 1,
      rolId: 1,
      funcionarioId: 1,
    });
    mockDesactivarTipoActa.mockRejectedValue(
      new ErrorConflicto(
        "No se puede eliminar un tipo de acta con actas asociadas"
      )
    );

    const { DELETE } = await import("../route");
    const respuesta = await DELETE(
      new Request("http://localhost/api/tipos-acta/1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "1" }) }
    );

    expect(respuesta.status).toBe(409);
    expect(await respuesta.json()).toEqual({
      error: "No se puede eliminar un tipo de acta con actas asociadas",
    });
  });
});
