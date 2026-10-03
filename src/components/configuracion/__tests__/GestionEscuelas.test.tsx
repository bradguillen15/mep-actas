// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GestionEscuelas } from "../GestionEscuelas";

let usuario: { nivel: number; regionId?: number } = { nivel: 1 };
const mutarMock = vi.fn();
let falla = false;

vi.mock("@/hooks/useSesion", () => ({
  useSesion: () => ({ usuario }),
}));

const datos = new Map<string, unknown>([
  ["/api/regiones", [
    { id: 1, nombre: "Central", activo: true },
    { id: 2, nombre: "Chorotega", activo: true },
    { id: 3, nombre: "Antigua", activo: false },
  ]],
  ["/api/escuelas", [
    { id: 10, nombre: "Escuela Uno", codigoMep: "E-001", regionId: 2, activo: true },
  ]],
]);

vi.mock("swr", () => ({
  default: (clave: string) => ({
    data: falla ? undefined : datos.get(clave),
    error: falla && clave === "/api/escuelas" ? new Error("Error 403") : undefined,
    isLoading: false,
    mutate: mutarMock,
  }),
  mutate: (...argumentos: unknown[]) => mutarMock(...argumentos),
}));

const fetchMock = vi.fn();

beforeEach(() => {
  usuario = { nivel: 1 };
  falla = false;
  mutarMock.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("GestionEscuelas", () => {
  it("muestra un estado de error con Reintentar cuando la carga falla", async () => {
    falla = true;
    render(<GestionEscuelas />);

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudieron cargar las escuelas");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(mutarMock).toHaveBeenCalled();
  });

  it("muestra el nombre de la región en lugar de su ID", () => {
    render(<GestionEscuelas />);
    expect(screen.getByText("Escuela Uno")).toBeInTheDocument();
    expect(screen.getByText("Chorotega")).toBeInTheDocument();
    expect(screen.queryByText("Región ID")).not.toBeInTheDocument();
  });

  it("muestra el nombre de la región aunque las regiones carguen después que las escuelas", () => {
    const regiones = datos.get("/api/regiones");
    datos.delete("/api/regiones");
    const { rerender } = render(<GestionEscuelas />);
    expect(screen.queryByText("Chorotega")).not.toBeInTheDocument();

    datos.set("/api/regiones", regiones);
    rerender(<GestionEscuelas />);

    expect(screen.getByText("Chorotega")).toBeInTheDocument();
  });

  it("muestra Nueva escuela a nivel 1 y 2, y la oculta a nivel 3 y 4", () => {
    for (const nivel of [1, 2]) {
      usuario = { nivel, regionId: 1 };
      const { unmount } = render(<GestionEscuelas />);
      expect(screen.getByRole("button", { name: /nueva escuela/i })).toBeInTheDocument();
      unmount();
    }
    for (const nivel of [3, 4]) {
      usuario = { nivel, regionId: 1 };
      const { unmount } = render(<GestionEscuelas />);
      expect(screen.queryByRole("button", { name: /nueva escuela/i })).not.toBeInTheDocument();
      unmount();
    }
  });

  it("Admin País elige entre las regiones activas y crea la escuela", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: 11 }) });
    render(<GestionEscuelas />);

    await userEvent.click(screen.getByRole("button", { name: /nueva escuela/i }));
    const selector = screen.getByLabelText(/^Región/);
    expect(selector).toBeEnabled();
    expect(screen.queryByRole("option", { name: "Antigua" })).not.toBeInTheDocument();

    await userEvent.selectOptions(selector, "Chorotega");
    await userEvent.type(screen.getByLabelText(/^Código MEP/), "E-002");
    await userEvent.type(screen.getByLabelText(/^Nombre/), "Escuela Dos");
    await userEvent.click(screen.getByRole("button", { name: "Crear escuela" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/escuelas",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ regionId: 2, codigoMep: "E-002", nombre: "Escuela Dos" }),
      })
    );
    await vi.waitFor(() => expect(mutarMock).toHaveBeenCalled());
  });

  it("Admin Regional tiene la región fija y deshabilitada", async () => {
    usuario = { nivel: 2, regionId: 2 };
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: 11 }) });
    render(<GestionEscuelas />);

    await userEvent.click(screen.getByRole("button", { name: /nueva escuela/i }));
    const selector = screen.getByLabelText(/^Región/) as HTMLSelectElement;
    expect(selector).toBeDisabled();
    expect(selector.value).toBe("2");

    await userEvent.type(screen.getByLabelText(/^Código MEP/), "E-003");
    await userEvent.type(screen.getByLabelText(/^Nombre/), "Escuela Tres");
    await userEvent.click(screen.getByRole("button", { name: "Crear escuela" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/escuelas",
      expect.objectContaining({
        body: JSON.stringify({ regionId: 2, codigoMep: "E-003", nombre: "Escuela Tres" }),
      })
    );
  });

  it("exige región, código y nombre antes de enviar", async () => {
    render(<GestionEscuelas />);
    await userEvent.click(screen.getByRole("button", { name: /nueva escuela/i }));
    await userEvent.click(screen.getByRole("button", { name: "Crear escuela" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(await screen.findByText("El código MEP es requerido")).toBeInTheDocument();
    expect(screen.getByText("El nombre es requerido")).toBeInTheDocument();
    expect(screen.getByText("La región es requerida")).toBeInTheDocument();
  });

  it("muestra en el modal el error devuelto por la API", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "El código MEP ya existe" }),
    });
    render(<GestionEscuelas />);

    await userEvent.click(screen.getByRole("button", { name: /nueva escuela/i }));
    await userEvent.selectOptions(screen.getByLabelText(/^Región/), "Central");
    await userEvent.type(screen.getByLabelText(/^Código MEP/), "E-001");
    await userEvent.type(screen.getByLabelText(/^Nombre/), "Duplicada");
    await userEvent.click(screen.getByRole("button", { name: "Crear escuela" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("El código MEP ya existe");
  });

  it("muestra Editar y Desactivar a nivel 1 y 2, y los oculta a nivel 3 y 4", () => {
    for (const nivel of [1, 2]) {
      usuario = { nivel, regionId: 2 };
      const { unmount } = render(<GestionEscuelas />);
      expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Desactivar" })).toBeInTheDocument();
      unmount();
    }
    for (const nivel of [3, 4]) {
      usuario = { nivel, regionId: 2 };
      const { unmount } = render(<GestionEscuelas />);
      expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Desactivar" })).not.toBeInTheDocument();
      unmount();
    }
  });

  it("edita nombre y código MEP, refresca la lista y cierra el modal", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: 10 }) });
    render(<GestionEscuelas />);

    await userEvent.click(screen.getByRole("button", { name: "Editar" }));
    const dialogo = await screen.findByRole("dialog", { name: "Editar escuela" });
    expect(within(dialogo).queryByLabelText(/^Región/)).not.toBeInTheDocument();

    const codigo = within(dialogo).getByLabelText(/^Código MEP/);
    const nombre = within(dialogo).getByLabelText(/^Nombre/);
    expect(codigo).toHaveValue("E-001");
    expect(nombre).toHaveValue("Escuela Uno");

    await userEvent.clear(codigo);
    await userEvent.type(codigo, "E-010");
    await userEvent.clear(nombre);
    await userEvent.type(nombre, "Escuela Renombrada");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Guardar cambios" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/escuelas/10",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ codigoMep: "E-010", nombre: "Escuela Renombrada" }),
      })
    );
    await vi.waitFor(() => expect(mutarMock).toHaveBeenCalled());
    await vi.waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("pide confirmación antes de desactivar y solo llama a la API al confirmar", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    render(<GestionEscuelas />);

    await userEvent.click(screen.getByRole("button", { name: "Desactivar" }));
    const dialogo = await screen.findByRole("dialog", { name: "Desactivar escuela" });
    expect(dialogo).toHaveTextContent("Escuela Uno");
    expect(fetchMock).not.toHaveBeenCalled();

    await userEvent.click(within(dialogo).getByRole("button", { name: "Desactivar" }));

    await vi.waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/escuelas/10", { method: "DELETE" })
    );
    await vi.waitFor(() => expect(mutarMock).toHaveBeenCalled());
  });

  it("muestra el error de la API al fallar la desactivación", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "No se puede desactivar una escuela con actas activas" }),
    });
    render(<GestionEscuelas />);

    await userEvent.click(screen.getByRole("button", { name: "Desactivar" }));
    const dialogo = await screen.findByRole("dialog");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Desactivar" }));

    expect(
      await screen.findByText("No se puede desactivar una escuela con actas activas")
    ).toBeInTheDocument();
  });
});
