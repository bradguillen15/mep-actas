// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { elegirOpcion, etiquetasOpciones } from "../../../../test/elegir-opcion";
import Usuarios from "../page";

const { sesion, mutarMock } = vi.hoisted(() => ({
  sesion: { nivel: 1, usuarioId: 99 },
  mutarMock: vi.fn(),
}));

vi.mock("@/hooks/useSesion", () => ({
  useSesion: () => ({
    usuario: {
      usuarioId: sesion.usuarioId,
      email: "pais@mep.go.cr",
      nivel: sesion.nivel,
      rolId: 1,
      funcionarioId: 1,
    },
  }),
}));

beforeEach(() => {
  sesion.nivel = 1;
  sesion.usuarioId = 99;
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

describe("Pantalla de usuarios — listado", () => {
  it("muestra la tabla con las acciones de cada usuario", () => {
    render(<Usuarios />);

    const tabla = screen.getByRole("table");
    expect(within(tabla).getByText("activa@mep.go.cr")).toBeInTheDocument();
    expect(within(tabla).getByText("inactiva@mep.go.cr")).toBeInTheDocument();
    expect(
      within(tabla).getAllByRole("button", { name: "Restablecer contraseña" })
    ).toHaveLength(2);
    expect(
      within(tabla).getByRole("button", { name: "Desactivar" })
    ).toBeInTheDocument();
    expect(
      within(tabla).getByRole("button", { name: "Activar" })
    ).toBeInTheDocument();
  });

  it("adapta la barra de acciones del encabezado en pantallas pequeñas", () => {
    render(<Usuarios />);

    const boton = screen.getByRole("button", { name: /Nuevo usuario/ });
    const barra = boton.closest(".flex-col");
    expect(barra).not.toBeNull();
    expect(barra!.className).toContain("sm:flex-row");
  });
});

describe("Pantalla de usuarios — cambio de estado", () => {
  afterEach(() => vi.unstubAllGlobals());

  const botonDesactivar = () =>
    within(screen.getByRole("table")).getByRole("button", {
      name: "Desactivar",
    });

  it("pide confirmación al desactivar y no llama a la API hasta confirmar", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    const usuaria = userEvent.setup();
    render(<Usuarios />);

    await usuaria.click(botonDesactivar());

    const dialogo = await screen.findByRole("dialog", { name: "Desactivar usuario" });
    expect(dialogo).toHaveTextContent("activa@mep.go.cr");
    expect(dialogo).toHaveTextContent("no podrá iniciar sesión");
    expect(fetchMock).not.toHaveBeenCalled();

    await usuaria.click(within(dialogo).getByRole("button", { name: "Desactivar" }));

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/usuarios/1");
    expect(opciones.method).toBe("PATCH");
    expect(JSON.parse(opciones.body)).toEqual({ activo: false });
    await vi.waitFor(() => expect(mutarMock).toHaveBeenCalled());
  });

  it("no desactiva si se cancela la confirmación", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const usuaria = userEvent.setup();
    render(<Usuarios />);

    await usuaria.click(botonDesactivar());
    const dialogo = await screen.findByRole("dialog");
    await usuaria.click(within(dialogo).getByRole("button", { name: "Cancelar" }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("activa un usuario inactivo sin pedir confirmación", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    const usuaria = userEvent.setup();
    render(<Usuarios />);

    await usuaria.click(
      within(screen.getByRole("table")).getByRole("button", {
        name: "Activar",
      })
    );

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ activo: true });
  });

  it("muestra un mensaje claro cuando cambiar el estado responde 403", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          error: "No tiene permisos para cambiar el estado de este usuario.",
        }),
      })
    );
    const usuaria = userEvent.setup();
    render(<Usuarios />);

    await usuaria.click(botonDesactivar());
    const dialogo = await screen.findByRole("dialog");
    await usuaria.click(within(dialogo).getByRole("button", { name: "Desactivar" }));

    expect(
      await screen.findByText("No tiene permisos para cambiar el estado de este usuario.")
    ).toBeInTheDocument();
  });

  it("no ofrece desactivar la propia cuenta", () => {
    sesion.usuarioId = 1;
    render(<Usuarios />);

    const tabla = screen.getByRole("table");
    expect(within(tabla).queryByRole("button", { name: "Desactivar" })).not.toBeInTheDocument();
    expect(within(tabla).getByRole("button", { name: "Activar" })).toBeInTheDocument();
  });
});

describe("Pantalla de usuarios — restablecer contraseña", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("envía la nueva contraseña con Enter y cierra el modal", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    const usuaria = userEvent.setup();
    render(<Usuarios />);

    const tabla = screen.getByRole("table");
    await usuaria.click(
      within(tabla).getAllByRole("button", { name: "Restablecer contraseña" })[0]
    );
    const dialogo = await screen.findByRole("dialog", { name: "Restablecer contraseña" });
    expect(within(dialogo).getByText(/Mínimo 12 caracteres/)).toBeInTheDocument();
    await usuaria.type(within(dialogo).getByLabelText(/^Nueva contraseña/), "Clave-Segura-123{Enter}");

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      password: "Clave-Segura-123",
    });
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("muestra en el modal el error de la API", async () => {
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

    const tabla = screen.getByRole("table");
    await usuaria.click(
      within(tabla).getAllByRole("button", { name: "Restablecer contraseña" })[0]
    );
    const dialogo = await screen.findByRole("dialog");
    await usuaria.type(within(dialogo).getByLabelText(/^Nueva contraseña/), "corta{Enter}");

    expect(
      await within(dialogo).findByText("La contraseña debe tener al menos 12 caracteres")
    ).toBeInTheDocument();
  });
});

describe("Pantalla de usuarios — Nuevo usuario", () => {
  const abrirModal = async (usuaria: ReturnType<typeof userEvent.setup>) => {
    await usuaria.click(screen.getByRole("button", { name: /^nuevo usuario$/i }));
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
    await elegirOpcion(/Funcionario/, "Carla Vargas", dialogo);
    await elegirOpcion(/Rol/, "Staff", dialogo);
    await usuaria.type(within(dialogo).getByLabelText(/Correo electrónico/), "nuevo@mep.go.cr");
    await usuaria.type(within(dialogo).getByLabelText(/Contraseña temporal/), "Clave-Segura-1");
    await usuaria.click(within(dialogo).getByRole("button", { name: "Crear usuario" }));

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
    await elegirOpcion(/Funcionario/, "Carla Vargas", dialogo);
    await elegirOpcion(/Rol/, "Staff", dialogo);
    await usuaria.type(within(dialogo).getByLabelText(/Correo electrónico/), "nuevo@mep.go.cr");
    await usuaria.type(within(dialogo).getByLabelText(/Contraseña temporal/), "corta");
    await usuaria.click(within(dialogo).getByRole("button", { name: "Crear usuario" }));

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
    await usuaria.click(within(dialogo).getByRole("button", { name: "Crear usuario" }));

    expect(await within(dialogo).findByText("El funcionario es requerido")).toBeInTheDocument();
    expect(within(dialogo).getByText("El rol es requerido")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("valida el formato del correo antes de enviar", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const usuaria = userEvent.setup();
    render(<Usuarios />);

    const dialogo = await abrirModal(usuaria);
    await elegirOpcion(/Funcionario/, "Carla Vargas", dialogo);
    await elegirOpcion(/Rol/, "Staff", dialogo);
    await usuaria.type(within(dialogo).getByLabelText(/Correo electrónico/), "no-es-correo");
    await usuaria.type(within(dialogo).getByLabelText(/Contraseña temporal/), "Clave-Segura-1");
    await usuaria.click(within(dialogo).getByRole("button", { name: "Crear usuario" }));

    expect(await within(dialogo).findByText("Ingrese un correo válido")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("ofrece todos los roles a Admin País", async () => {
    const usuaria = userEvent.setup();
    render(<Usuarios />);

    const dialogo = await abrirModal(usuaria);
    const etiquetas = await etiquetasOpciones(/Rol/, dialogo);
    expect(etiquetas).toEqual(["Admin País", "Admin Regional", "Staff"]);
  });

  it("limita los roles al nivel de la sesión o inferior", async () => {
    sesion.nivel = 2;
    const usuaria = userEvent.setup();
    render(<Usuarios />);

    const dialogo = await abrirModal(usuaria);
    const etiquetas = await etiquetasOpciones(/Rol/, dialogo);
    expect(etiquetas).toEqual(["Admin Regional", "Staff"]);
  });
});
