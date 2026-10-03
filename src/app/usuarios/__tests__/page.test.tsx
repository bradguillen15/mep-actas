// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Usuarios from "../page";

const { sesion, mutarMock } = vi.hoisted(() => ({
  sesion: { nivel: 1 },
  mutarMock: vi.fn(),
}));

vi.mock("@/hooks/useSesion", () => ({
  useSesion: () => ({
    usuario: {
      usuarioId: 1,
      email: "pais@mep.go.cr",
      nivel: sesion.nivel,
      rolId: 1,
      funcionarioId: 1,
    },
  }),
}));

beforeEach(() => {
  sesion.nivel = 1;
  mutarMock.mockReset();
});

vi.mock("swr", () => {
  const datosPorClave = new Map<string, unknown>([
    [
      "/api/usuarios",
      [
      {
        id: 1,
        email: "activa@mep.go.cr",
        activo: true,
        funcionarioId: 1,
        rolId: 4,
        nivel: 4,
        funcionarioNombres: "Ana",
        funcionarioApellidos: "Rojas",
        funcionarioPuesto: "Staff",
      },
      {
        id: 2,
        email: "inactiva@mep.go.cr",
        activo: false,
        funcionarioId: 2,
        rolId: 4,
        nivel: 4,
        funcionarioNombres: "Luis",
        funcionarioApellidos: "Mora",
        funcionarioPuesto: "Staff",
      },
      ],
    ],
    [
      "/api/roles",
      [
        { id: 1, nombre: "Admin País", nivel: 1 },
        { id: 2, nombre: "Admin Regional", nivel: 2 },
        { id: 4, nombre: "Staff", nivel: 4 },
      ],
    ],
    [
      "/api/funcionarios",
      [
        { id: 7, nombres: "Carla", apellidos: "Vargas" },
        { id: 8, nombres: "Pedro", apellidos: "Solano" },
      ],
    ],
  ]);
  return {
    default: (clave: string) => ({
      data: datosPorClave.get(clave),
      isLoading: false,
      mutate: mutarMock,
    }),
  };
});

describe("Pantalla de usuarios — responsividad", () => {
  it("presenta las tarjetas móviles con las mismas acciones y ocultas en escritorio", () => {
    render(<Usuarios />);

    const lista = screen.getByRole("list", { name: "Lista de usuarios" });
    expect(lista).toHaveClass("md:hidden");

    const tarjetas = within(lista).getAllByRole("listitem");
    expect(tarjetas).toHaveLength(2);

    expect(
      within(lista).getAllByRole("button", { name: /contraseña/i })
    ).toHaveLength(2);
    expect(
      within(lista).getByRole("button", { name: "Desactivar" })
    ).toBeInTheDocument();
    expect(
      within(lista).getByRole("button", { name: "Activar" })
    ).toBeInTheDocument();
  });

  it("muestra la tabla solo en pantallas medianas o mayores", () => {
    render(<Usuarios />);

    const tabla = screen.getByRole("table");
    const contenedorEscritorio = tabla.closest(".hidden");
    expect(contenedorEscritorio).not.toBeNull();
    expect(contenedorEscritorio!.className).toContain("md:block");
  });

  it("apila el encabezado en columna en pantallas pequeñas", () => {
    render(<Usuarios />);

    const titulo = screen.getByRole("heading", { name: "Usuarios" });
    const encabezado = titulo.closest(".flex-col");
    expect(encabezado).not.toBeNull();
    expect(encabezado!.className).toContain("sm:flex-row");
  });
});

describe("Pantalla de usuarios — manejo de 403", () => {
  it("muestra un mensaje claro cuando cambiar el estado responde 403", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 403 })
    );
    const usuaria = userEvent.setup();
    render(<Usuarios />);

    const lista = screen.getByRole("list", { name: "Lista de usuarios" });
    await usuaria.click(
      within(lista).getByRole("button", { name: "Desactivar" })
    );

    expect(
      await screen.findByText(
        "No tiene permisos para cambiar el estado de este usuario."
      )
    ).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});

describe("Pantalla de usuarios — Invitar usuario", () => {
  const abrirModal = async (usuaria: ReturnType<typeof userEvent.setup>) => {
    await usuaria.click(screen.getByRole("button", { name: /invitar usuario/i }));
    return screen.getByRole("dialog");
  };

  it("envía funcionarioId y rolId numéricos junto con correo y contraseña, y refresca la lista", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 201, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);
    const usuaria = userEvent.setup();
    render(<Usuarios />);

    const dialogo = await abrirModal(usuaria);
    await usuaria.selectOptions(within(dialogo).getByLabelText("Funcionario"), "7");
    await usuaria.selectOptions(within(dialogo).getByLabelText("Rol"), "4");
    await usuaria.type(within(dialogo).getByLabelText("Correo electrónico"), "nuevo@mep.go.cr");
    await usuaria.type(within(dialogo).getByLabelText("Contraseña temporal"), "Clave-Segura-1");
    await usuaria.click(within(dialogo).getByRole("button", { name: "Crear" }));

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/usuarios");
    expect(opciones.method).toBe("POST");
    expect(JSON.parse(opciones.body)).toEqual({
      funcionarioId: 7,
      rolId: 4,
      email: "nuevo@mep.go.cr",
      password: "Clave-Segura-1",
    });
    await vi.waitFor(() => expect(mutarMock).toHaveBeenCalled());
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    vi.unstubAllGlobals();
  });

  it("muestra en el modal el error que devuelve la API y lo deja abierto", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: "La contraseña debe tener al menos 12 caracteres" }),
      })
    );
    const usuaria = userEvent.setup();
    render(<Usuarios />);

    const dialogo = await abrirModal(usuaria);
    await usuaria.selectOptions(within(dialogo).getByLabelText("Funcionario"), "7");
    await usuaria.selectOptions(within(dialogo).getByLabelText("Rol"), "4");
    await usuaria.type(within(dialogo).getByLabelText("Correo electrónico"), "nuevo@mep.go.cr");
    await usuaria.type(within(dialogo).getByLabelText("Contraseña temporal"), "corta");
    await usuaria.click(within(dialogo).getByRole("button", { name: "Crear" }));

    expect(
      await within(dialogo).findByText("La contraseña debe tener al menos 12 caracteres")
    ).toBeInTheDocument();
    expect(mutarMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("exige completar los campos antes de enviar", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const usuaria = userEvent.setup();
    render(<Usuarios />);

    const dialogo = await abrirModal(usuaria);
    await usuaria.click(within(dialogo).getByRole("button", { name: "Crear" }));

    expect(await within(dialogo).findByText("El funcionario es requerido")).toBeInTheDocument();
    expect(within(dialogo).getByText("El rol es requerido")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("ofrece todos los roles a Admin País", async () => {
    const usuaria = userEvent.setup();
    render(<Usuarios />);

    const dialogo = await abrirModal(usuaria);
    const etiquetas = within(within(dialogo).getByLabelText("Rol"))
      .getAllByRole("option")
      .map((o) => o.textContent);
    expect(etiquetas).toEqual(["Seleccione un rol", "Admin País", "Admin Regional", "Staff"]);
  });

  it("limita los roles al nivel de la sesión o inferior", async () => {
    sesion.nivel = 2;
    const usuaria = userEvent.setup();
    render(<Usuarios />);

    const dialogo = await abrirModal(usuaria);
    const etiquetas = within(within(dialogo).getByLabelText("Rol"))
      .getAllByRole("option")
      .map((o) => o.textContent);
    expect(etiquetas).toEqual(["Seleccione un rol", "Admin Regional", "Staff"]);
  });
});
