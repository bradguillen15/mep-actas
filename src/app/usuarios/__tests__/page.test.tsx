// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Usuarios from "../page";

vi.mock("@/hooks/useSesion", () => ({
  useSesion: () => ({
    usuario: {
      usuarioId: 1,
      email: "pais@mep.go.cr",
      nivel: 1,
      rolId: 1,
      funcionarioId: 1,
    },
  }),
}));

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
        { id: 4, nombre: "Staff", nivel: 4 },
      ],
    ],
    ["/api/funcionarios", []],
  ]);
  return {
    default: (clave: string) => ({
      data: datosPorClave.get(clave),
      isLoading: false,
      mutate: vi.fn(),
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
