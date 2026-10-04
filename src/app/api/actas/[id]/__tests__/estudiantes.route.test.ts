import { describe, it, expect, vi, beforeEach } from "vitest";
import { ErrorValidacion } from "@/server/errores";

const mockObtenerSesion = vi.fn();
const mockAgregarEstudiante = vi.fn();
const mockAgregarEstudiantes = vi.fn();

vi.mock("@/server/auth/sesion.servicio", () => ({
  obtenerSesion: mockObtenerSesion,
}));
vi.mock("next-auth", () => ({
  default: () => ({ auth: vi.fn(), handlers: {}, signIn: vi.fn(), signOut: vi.fn() }),
}));
vi.mock("@/db/cliente", () => ({ clienteDb: () => ({}) }));
vi.mock("@/server/servicios/actas.fabrica", () => ({
  crearServicioActasDesdeDb: () => ({
    agregarEstudiante: mockAgregarEstudiante,
    agregarEstudiantes: mockAgregarEstudiantes,
  }),
}));

const sesionStaff = {
  usuarioId: 4,
  email: "staff@escuela.go.cr",
  nivel: 4,
  rolId: 4,
  funcionarioId: 4,
  escuelaId: 5,
};

const parametros = { params: Promise.resolve({ id: "1" }) };

function solicitud(cuerpo: unknown) {
  return new Request("http://localhost/api/actas/1/estudiantes", {
    method: "POST",
    body: JSON.stringify(cuerpo),
  }) as never;
}

describe("POST /api/actas/[id]/estudiantes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockObtenerSesion.mockResolvedValue(sesionStaff);
    mockAgregarEstudiante.mockResolvedValue({ id: 9 });
    mockAgregarEstudiantes.mockResolvedValue([{ id: 9 }, { id: 10 }]);
  });

  it("mantiene el cuerpo individual por personaId", async () => {
    const { POST } = await import("../estudiantes/route");
    const respuesta = await POST(solicitud({ personaId: 3, numeroCertificado: 7 }), parametros);

    expect(respuesta.status).toBe(201);
    expect(mockAgregarEstudiante).toHaveBeenCalledWith(1, 3, 7, sesionStaff);
    expect(mockAgregarEstudiantes).not.toHaveBeenCalled();
  });

  it("acepta un lote { estudiantes } y lo procesa de forma atómica", async () => {
    const estudiantes = [
      { identificacion: "1-1", nombres: "A", apellidos: "B", numeroCertificado: 1 },
    ];
    const { POST } = await import("../estudiantes/route");
    const respuesta = await POST(solicitud({ estudiantes }), parametros);

    expect(respuesta.status).toBe(201);
    expect(mockAgregarEstudiantes).toHaveBeenCalledWith(1, estudiantes, sesionStaff);
    expect(await respuesta.json()).toEqual([{ id: 9 }, { id: 10 }]);
  });

  it("responde 400 con el mensaje de validación del lote", async () => {
    mockAgregarEstudiantes.mockRejectedValue(
      new ErrorValidacion("Estudiante 1 (cédula 1-1): el número de certificado 1 ya está registrado en el acta")
    );
    const { POST } = await import("../estudiantes/route");
    const respuesta = await POST(solicitud({ estudiantes: [{}] }), parametros);

    expect(respuesta.status).toBe(400);
    expect((await respuesta.json()).error).toContain("Estudiante 1");
  });
});
