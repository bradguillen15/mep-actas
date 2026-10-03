// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GestionTiposActa } from "../GestionTiposActa";

const refrescarMock = vi.fn();
let falla = false;

vi.mock("swr", () => ({
  default: () => ({
    data: falla ? undefined : [{ id: 1, nombre: "Graduación" }],
    error: falla ? new Error("Error 403") : undefined,
    isLoading: false,
    mutate: refrescarMock,
  }),
  mutate: vi.fn(),
}));

const fetchMock = vi.fn();

beforeEach(() => {
  falla = false;
  refrescarMock.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("GestionTiposActa", () => {
  it("muestra un estado de error con Reintentar cuando la carga falla", async () => {
    falla = true;
    render(<GestionTiposActa />);

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudieron cargar los tipos de acta");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(refrescarMock).toHaveBeenCalled();
  });

  it("ya no muestra el campo en línea y abre el modal con el botón", async () => {
    render(<GestionTiposActa />);
    expect(screen.queryByPlaceholderText("Nuevo tipo de acta")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /nuevo tipo de acta/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("crea el tipo de acta y refresca la lista", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: 2 }) });
    render(<GestionTiposActa />);

    await userEvent.click(screen.getByRole("button", { name: /nuevo tipo de acta/i }));
    await userEvent.type(screen.getByLabelText(/^Nombre/), "  Título  ");
    await userEvent.click(screen.getByRole("button", { name: "Crear tipo de acta" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/tipos-acta",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ nombre: "Título" }),
      })
    );
    await vi.waitFor(() => expect(refrescarMock).toHaveBeenCalled());
  });

  it("muestra el error de la API en el modal", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "El nombre es requerido" }),
    });
    render(<GestionTiposActa />);

    await userEvent.click(screen.getByRole("button", { name: /nuevo tipo de acta/i }));
    await userEvent.type(screen.getByLabelText(/^Nombre/), "X");
    await userEvent.click(screen.getByRole("button", { name: "Crear tipo de acta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("El nombre es requerido");
  });

  it("pide confirmación antes de eliminar y solo llama a la API al confirmar", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    render(<GestionTiposActa />);

    await userEvent.click(
      screen.getByRole("button", { name: "Eliminar" })
    );
    const dialogo = await screen.findByRole("dialog", { name: "Eliminar tipo de acta" });
    expect(dialogo).toHaveTextContent("Graduación");
    expect(fetchMock).not.toHaveBeenCalled();

    await userEvent.click(within(dialogo).getByRole("button", { name: "Eliminar" }));

    await vi.waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/tipos-acta/1", { method: "DELETE" })
    );
    await vi.waitFor(() => expect(refrescarMock).toHaveBeenCalled());
  });

  it("no elimina si se cancela la confirmación", async () => {
    render(<GestionTiposActa />);

    await userEvent.click(
      screen.getByRole("button", { name: "Eliminar" })
    );
    const dialogo = await screen.findByRole("dialog");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Cancelar" }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("muestra el error de la API al fallar la eliminación", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "El tipo está en uso" }),
    });
    render(<GestionTiposActa />);

    await userEvent.click(
      screen.getByRole("button", { name: "Eliminar" })
    );
    const dialogo = await screen.findByRole("dialog");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Eliminar" }));

    expect(await screen.findByText("El tipo está en uso")).toBeInTheDocument();
  });
});
