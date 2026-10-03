import { describe, it, expect, vi, beforeEach } from "vitest";

import { ErrorProhibido } from "@/server/errores";

const mockObtenerSesion = vi.fn();
const mockActualizarEscuela = vi.fn();
const mockDesactivarEscuela = vi.fn();

vi.mock("@/db/cliente", () => ({ clienteDb: () => ({}) }));

vi.mock("@/server/servicios/auditoria.servicio", () => ({
  crearAuditor: () => vi.fn(),
}));

vi.mock("@/server/servicios/escuelas.servicio", () => ({
  crearServicioEscuelas: () => ({
    actualizarEscuela: mockActualizarEscuela,
    desactivarEscuela: mockDesactivarEscuela,
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

describe("PATCH /api/escuelas/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 si no hay sesion", async () => {
    mockObtenerSesion.mockResolvedValue(null);

    const { PATCH } = await import("../route");
    const req = new Request("http://localhost/api/escuelas/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: "Actualizado" }),
    });
    const respuesta = await PATCH(req, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(respuesta.status).toBe(401);
  });

  it("retorna 403 si no es Admin Regional (nivel=1)", async () => {
    mockObtenerSesion.mockResolvedValue({
      usuarioId: 3,
      email: "admin@escuela.go.cr",
      nivel: 3,
      rolId: 3,
      funcionarioId: 3,
    });

    const { PATCH } = await import("../route");
    const req = new Request("http://localhost/api/escuelas/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: "Actualizado" }),
    });
    const respuesta = await PATCH(req, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(respuesta.status).toBe(403);
  });
});

describe("DELETE /api/escuelas/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 si no hay sesion", async () => {
    mockObtenerSesion.mockResolvedValue(null);

    const { DELETE } = await import("../route");
    const req = new Request("http://localhost/api/escuelas/1", {
      method: "DELETE",
    });
    const respuesta = await DELETE(req, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(respuesta.status).toBe(401);
  });

  it("retorna 403 si es Staff (nivel=4)", async () => {
    mockObtenerSesion.mockResolvedValue({
      usuarioId: 4,
      email: "staff@escuela.go.cr",
      nivel: 4,
      rolId: 4,
      funcionarioId: 4,
    });

    const { DELETE } = await import("../route");
    const req = new Request("http://localhost/api/escuelas/1", {
      method: "DELETE",
    });
    const respuesta = await DELETE(req, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(respuesta.status).toBe(403);
  });
});

describe("PATCH y DELETE /api/escuelas/[id] ante ErrorProhibido", () => {
  const sesionRegional = {
    usuarioId: 2,
    email: "regional@mep.go.cr",
    nivel: 2,
    rolId: 2,
    funcionarioId: 2,
    regionId: 1,
  };
  const contexto = { params: Promise.resolve({ id: "1" }) };

  beforeEach(() => {
    vi.clearAllMocks();
    mockObtenerSesion.mockResolvedValue(sesionRegional);
  });

  it("PATCH retorna 403 con el mensaje legible", async () => {
    mockActualizarEscuela.mockRejectedValue(
      new ErrorProhibido("No tiene permisos para modificar esta escuela")
    );

    const { PATCH } = await import("../route");
    const respuesta = await PATCH(
      new Request("http://localhost/api/escuelas/1", {
        method: "PATCH",
        body: JSON.stringify({ nombre: "Nuevo" }),
      }),
      contexto
    );

    expect(respuesta.status).toBe(403);
    expect(await respuesta.json()).toEqual({
      error: "No tiene permisos para modificar esta escuela",
    });
  });

  it("DELETE retorna 403 con el mensaje legible", async () => {
    mockDesactivarEscuela.mockRejectedValue(
      new ErrorProhibido("No tiene permisos para desactivar esta escuela")
    );

    const { DELETE } = await import("../route");
    const respuesta = await DELETE(
      new Request("http://localhost/api/escuelas/1", { method: "DELETE" }),
      contexto
    );

    expect(respuesta.status).toBe(403);
    expect(await respuesta.json()).toEqual({
      error: "No tiene permisos para desactivar esta escuela",
    });
  });
});
