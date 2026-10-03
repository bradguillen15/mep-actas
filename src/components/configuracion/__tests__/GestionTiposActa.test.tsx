// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GestionTiposActa } from "../GestionTiposActa";

const refrescarMock = vi.fn();

vi.mock("swr", () => ({
  default: () => ({
    data: [{ id: 1, nombre: "Graduación" }],
    isLoading: false,
    mutate: refrescarMock,
  }),
  mutate: vi.fn(),
}));

const fetchMock = vi.fn();

beforeEach(() => {
  refrescarMock.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("GestionTiposActa", () => {
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
    await userEvent.type(screen.getByLabelText("Nombre"), "  Título  ");
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
    await userEvent.type(screen.getByLabelText("Nombre"), "X");
    await userEvent.click(screen.getByRole("button", { name: "Crear tipo de acta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("El nombre es requerido");
  });
});
