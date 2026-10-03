import { describe, it, expect, vi, beforeEach } from "vitest";

const mockObtenerSesion = vi.fn();
const mockResolverAmbitoDeEscuela = vi.fn();
const mockCrearEscaneo = vi.fn();
const mockListarEscaneos = vi.fn();

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

vi.mock("@/db/cliente", () => ({
  clienteDb: () => ({}),
}));

vi.mock("@/server/repositorios/escuelas.repositorio", () => ({
  resolverAmbitoDeEscuela: mockResolverAmbitoDeEscuela,
}));

vi.mock("@/server/servicios/auditoria.servicio", () => ({
  crearAuditor: () => vi.fn(),
}));

vi.mock("@/server/almacenamiento/r2.util", () => ({
  construirClave: () => "escaneos/5/1/1.jpg",
  generarUrlSubida: async () => "https://r2.example/subida-firmada",
  generarUrlLectura: async () => "https://r2.example/lectura-firmada",
}));

vi.mock("@/server/repositorios/escaneos.repositorio", () => ({
  listarEscaneos: mockListarEscaneos,
  obtenerEscaneoPorId: vi.fn(),
  crearEscaneo: mockCrearEscaneo,
  eliminarEscaneo: vi.fn(),
}));

function sesionStaff() {
  return {
    usuarioId: 4,
    email: "staff@escuela.go.cr",
    nivel: 4,
    rolId: 4,
    funcionarioId: 4,
    escuelaId: 5,
  };
}

function sesionAdminEscuela() {
  return {
    usuarioId: 3,
    email: "escuela@mep.go.cr",
    nivel: 3,
    rolId: 3,
    funcionarioId: 3,
    escuelaId: 5,
  };
}

function sesionAdminRegional() {
  return {
    usuarioId: 2,
    email: "regional@mep.go.cr",
    nivel: 2,
    rolId: 2,
    funcionarioId: 2,
    regionId: 1,
  };
}

function sesionAdminPais() {
  return {
    usuarioId: 1,
    email: "pais@mep.go.cr",
    nivel: 1,
    rolId: 1,
    funcionarioId: 1,
  };
}

describe("POST /api/escaneos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCrearEscaneo.mockResolvedValue({
      id: 1,
      escuelaId: 5,
      numeroTomo: 1,
      numeroFolio: 1,
      url: "escaneos/5/1/1.jpg",
      formato: "jpg",
      uploadedBy: 4,
    });
  });

  it("permite a Staff (nivel 4) preparar subida en su propia escuela", async () => {
    mockObtenerSesion.mockResolvedValue(sesionStaff());

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/escaneos", {
      method: "POST",
      body: JSON.stringify({
        escuelaId: 5,
        numeroTomo: 1,
        numeroFolio: 1,
        formato: "jpg",
      }),
    });

    const respuesta = await POST(req as never);

    expect(respuesta.status).toBe(201);
    expect(mockCrearEscaneo).toHaveBeenCalled();
  });

  it("deniega a Staff preparar subida en otra escuela", async () => {
    mockObtenerSesion.mockResolvedValue(sesionStaff());

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/escaneos", {
      method: "POST",
      body: JSON.stringify({
        escuelaId: 10,
        numeroTomo: 1,
        numeroFolio: 1,
        formato: "jpg",
      }),
    });

    const respuesta = await POST(req as never);

    expect(respuesta.status).toBe(403);
    expect(await respuesta.json()).toEqual({ error: "No tiene permisos sobre esta escuela o región" });
    expect(mockCrearEscaneo).not.toHaveBeenCalled();
  });

  it("Admin Escuela (nivel 3) sigue pudiendo preparar subida en su propia escuela (regresión)", async () => {
    mockObtenerSesion.mockResolvedValue(sesionAdminEscuela());

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/escaneos", {
      method: "POST",
      body: JSON.stringify({
        escuelaId: 5,
        numeroTomo: 1,
        numeroFolio: 1,
        formato: "jpg",
      }),
    });

    const respuesta = await POST(req as never);

    expect(respuesta.status).toBe(201);
  });

  it("Admin Regional (nivel 2) registra en una escuela de su región", async () => {
    mockObtenerSesion.mockResolvedValue(sesionAdminRegional());
    mockResolverAmbitoDeEscuela.mockResolvedValue({ escuelaId: 7, regionId: 1 });

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/escaneos", {
      method: "POST",
      body: JSON.stringify({
          escuelaId: 7,
          numeroTomo: 1,
          numeroFolio: 1,
          formato: "jpg",
        }),
    });

    const respuesta = await POST(req as never);

    expect(respuesta.status).toBe(201);
    expect(mockResolverAmbitoDeEscuela).toHaveBeenCalledWith(expect.anything(), 7);
    expect(mockCrearEscaneo).toHaveBeenCalled();
  });

  it("Admin Regional (nivel 2) no registra en una escuela de otra región", async () => {
    mockObtenerSesion.mockResolvedValue(sesionAdminRegional());
    mockResolverAmbitoDeEscuela.mockResolvedValue({ escuelaId: 8, regionId: 2 });

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/escaneos", {
      method: "POST",
      body: JSON.stringify({
          escuelaId: 8,
          numeroTomo: 1,
          numeroFolio: 1,
          formato: "jpg",
        }),
    });

    const respuesta = await POST(req as never);

    expect(respuesta.status).toBe(403);
    expect(await respuesta.json()).toEqual({ error: "No tiene permisos sobre esta escuela o región" });
    expect(mockResolverAmbitoDeEscuela).toHaveBeenCalledWith(expect.anything(), 8);
    expect(mockCrearEscaneo).not.toHaveBeenCalled();
  });

  it("Admin Regional (nivel 2) recibe 403 si la escuela no existe", async () => {
    mockObtenerSesion.mockResolvedValue(sesionAdminRegional());
    mockResolverAmbitoDeEscuela.mockResolvedValue(undefined);

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/escaneos", {
      method: "POST",
      body: JSON.stringify({
          escuelaId: 999,
          numeroTomo: 1,
          numeroFolio: 1,
          formato: "jpg",
        }),
    });

    const respuesta = await POST(req as never);

    expect(respuesta.status).toBe(403);
    expect(await respuesta.json()).toEqual({ error: "No tiene permisos sobre esta escuela o región" });
    expect(mockResolverAmbitoDeEscuela).toHaveBeenCalledWith(expect.anything(), 999);
    expect(mockCrearEscaneo).not.toHaveBeenCalled();
  });

  it("Admin País (nivel 1) sigue sin restricción de escuela (regresión)", async () => {
    mockObtenerSesion.mockResolvedValue(sesionAdminPais());

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/escaneos", {
      method: "POST",
      body: JSON.stringify({
        escuelaId: 999,
        numeroTomo: 1,
        numeroFolio: 1,
        formato: "jpg",
      }),
    });

    const respuesta = await POST(req as never);

    expect(respuesta.status).toBe(201);
  });
});

describe("GET /api/escaneos con ámbito", () => {
  it("Staff lista solo su escuela", async () => {
    vi.clearAllMocks();
    mockListarEscaneos.mockResolvedValue([]);
    mockObtenerSesion.mockResolvedValue(sesionStaff());
    const { GET } = await import("../route");
    const respuesta = await GET(new Request("http://localhost/api/escaneos") as never);
    expect(respuesta.status).toBe(200);
    expect(mockListarEscaneos).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Object),
      { tipo: "escuela", escuelaId: 5 }
    );
  });

  it("Admin País sin escuelaId recibe 400 porque los tomos son propios de cada escuela", async () => {
    vi.clearAllMocks();
    mockObtenerSesion.mockResolvedValue(sesionAdminPais());
    const { GET } = await import("../route");
    const respuesta = await GET(new Request("http://localhost/api/escaneos?tomo=1") as never);
    expect(respuesta.status).toBe(400);
    expect(mockListarEscaneos).not.toHaveBeenCalled();
  });

  it("Admin Regional sin escuelaId recibe 400", async () => {
    vi.clearAllMocks();
    mockObtenerSesion.mockResolvedValue(sesionAdminRegional());
    const { GET } = await import("../route");
    const respuesta = await GET(new Request("http://localhost/api/escaneos?tomo=1") as never);
    expect(respuesta.status).toBe(400);
    expect(mockListarEscaneos).not.toHaveBeenCalled();
  });

  it("Admin País con escuelaId lista solo esa escuela", async () => {
    vi.clearAllMocks();
    mockListarEscaneos.mockResolvedValue([]);
    mockObtenerSesion.mockResolvedValue(sesionAdminPais());
    const { GET } = await import("../route");
    const respuesta = await GET(
      new Request("http://localhost/api/escaneos?escuelaId=7&tomo=1") as never
    );
    expect(respuesta.status).toBe(200);
    expect(mockListarEscaneos).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ escuelaId: 7, tomo: 1 }),
      { tipo: "pais" }
    );
  });
});
