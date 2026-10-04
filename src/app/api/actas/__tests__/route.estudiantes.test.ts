import { describe, it, expect, vi, beforeEach } from "vitest";
import { ErrorPersistencia, ErrorValidacion } from "@/server/errores";

const mockObtenerSesion = vi.fn();
const mockCrearActa = vi.fn();
const mockCrearActaConEstudiantes = vi.fn();

vi.mock("@/server/auth/sesion.servicio", () => ({
  obtenerSesion: mockObtenerSesion,
}));
vi.mock("next-auth", () => ({
  default: () => ({ auth: vi.fn(), handlers: {}, signIn: vi.fn(), signOut: vi.fn() }),
}));
vi.mock("@/db/cliente", () => ({ clienteDb: () => ({}) }));
vi.mock("@/server/repositorios/escuelas.repositorio", () => ({
  resolverAmbitoDeEscuela: vi.fn(),
}));
vi.mock("@/server/servicios/actas.fabrica", () => ({
  crearServicioActasDesdeDb: () => ({
    crearActa: mockCrearActa,
    crearActaConEstudiantes: mockCrearActaConEstudiantes,
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

const estudiantes = [
  { identificacion: "1-1111-1111", nombres: "Ana", apellidos: "Mora", numeroCertificado: 1 },
];

function solicitud(cuerpo: unknown) {
  return new Request("http://localhost/api/actas", {
    method: "POST",
    body: JSON.stringify(cuerpo),
  }) as never;
}

describe("POST /api/actas con estudiantes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockObtenerSesion.mockResolvedValue(sesionStaff);
    mockCrearActa.mockResolvedValue({ id: 1, escuelaId: 5 });
    mockCrearActaConEstudiantes.mockResolvedValue({ id: 1, escuelaId: 5, estudiantes: [] });
  });

  it("crea el acta y los estudiantes en una sola operación", async () => {
    const { POST } = await import("../route");
    const respuesta = await POST(solicitud({ escuelaId: 5, titulo: "A", estudiantes }));

    expect(respuesta.status).toBe(201);
    expect(mockCrearActaConEstudiantes).toHaveBeenCalledWith(
      { escuelaId: 5, titulo: "A" },
      estudiantes,
      sesionStaff
    );
    expect(mockCrearActa).not.toHaveBeenCalled();
  });

  it("sin estudiantes mantiene el flujo anterior", async () => {
    const { POST } = await import("../route");
    const respuesta = await POST(solicitud({ escuelaId: 5, titulo: "A" }));

    expect(respuesta.status).toBe(201);
    expect(mockCrearActa).toHaveBeenCalled();
    expect(mockCrearActaConEstudiantes).not.toHaveBeenCalled();
  });

  it("deniega crear con estudiantes en otra escuela sin tocar el servicio", async () => {
    const { POST } = await import("../route");
    const respuesta = await POST(solicitud({ escuelaId: 10, titulo: "A", estudiantes }));

    expect(respuesta.status).toBe(403);
    expect(mockCrearActaConEstudiantes).not.toHaveBeenCalled();
  });

  it("responde 400 con el mensaje de validación", async () => {
    mockCrearActaConEstudiantes.mockRejectedValue(
      new ErrorValidacion("Estudiante 2 (cédula 2-2222-2222): certificado repetido")
    );
    const { POST } = await import("../route");
    const respuesta = await POST(solicitud({ escuelaId: 5, titulo: "A", estudiantes }));

    expect(respuesta.status).toBe(400);
    expect(await respuesta.json()).toEqual({
      error: "Estudiante 2 (cédula 2-2222-2222): certificado repetido",
    });
  });

  it("responde 500 con el mensaje cuando la escritura falla y se revierte", async () => {
    mockCrearActaConEstudiantes.mockRejectedValue(
      new ErrorPersistencia("Estudiante 1 (cédula 1-1111-1111): no se pudo registrar")
    );
    const { POST } = await import("../route");
    const respuesta = await POST(solicitud({ escuelaId: 5, titulo: "A", estudiantes }));

    expect(respuesta.status).toBe(500);
    expect((await respuesta.json()).error).toContain("Estudiante 1");
  });
});
