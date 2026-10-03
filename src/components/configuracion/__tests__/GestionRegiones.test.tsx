// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GestionRegiones } from "../GestionRegiones";

let nivel = 1;
let falla = false;
const mutarMock = vi.fn();

vi.mock("@/hooks/useSesion", () => ({
  useSesion: () => ({ usuario: { nivel } }),
}));

vi.mock("swr", () => ({
  default: (clave: string) => ({
    data:
      clave === "/api/regiones" && !falla
        ? [{ id: 1, nombre: "Central", activo: true }]
        : undefined,
    error: falla ? new Error("Error 403") : undefined,
    isLoading: false,
    mutate: mutarMock,
  }),
  mutate: (...argumentos: unknown[]) => mutarMock(...argumentos),
}));

const fetchMock = vi.fn();

beforeEach(() => {
  nivel = 1;
  falla = false;
  mutarMock.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("GestionRegiones", () => {
  it("muestra un estado de error con Reintentar cuando la carga falla", async () => {
    falla = true;
    render(<GestionRegiones />);

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudieron cargar las regiones");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(mutarMock).toHaveBeenCalled();
  });

  it("lista las regiones existentes", () => {
    render(<GestionRegiones />);
    expect(screen.getByText("Central")).toBeInTheDocument();
  });

  it("muestra el botón Nueva región solo al Admin País", () => {
    const { unmount } = render(<GestionRegiones />);
    expect(screen.getByRole("button", { name: /nueva región/i })).toBeInTheDocument();
    unmount();

    nivel = 2;
    render(<GestionRegiones />);
    expect(screen.queryByRole("button", { name: /nueva región/i })).not.toBeInTheDocument();
  });

  it("crea la región, refresca la lista y cierra el modal", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: 2 }) });
    render(<GestionRegiones />);

    await userEvent.click(screen.getByRole("button", { name: /nueva región/i }));
    await userEvent.type(screen.getByLabelText(/^Nombre/), "Chorotega");
    await userEvent.click(screen.getByRole("button", { name: "Crear región" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/regiones",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ nombre: "Chorotega" }),
      })
    );
    await vi.waitFor(() => expect(mutarMock).toHaveBeenCalledWith("/api/regiones"));
    await vi.waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("no envía si el nombre está vacío", async () => {
    render(<GestionRegiones />);
    await userEvent.click(screen.getByRole("button", { name: /nueva región/i }));
    await userEvent.click(screen.getByRole("button", { name: "Crear región" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await screen.findByText("El nombre es requerido")).toBeInTheDocument();
  });

  it("muestra en el modal el error devuelto por la API", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "La región ya existe" }),
    });
    render(<GestionRegiones />);

    await userEvent.click(screen.getByRole("button", { name: /nueva región/i }));
    await userEvent.type(screen.getByLabelText(/^Nombre/), "Central");
    await userEvent.click(screen.getByRole("button", { name: "Crear región" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("La región ya existe");
    expect(mutarMock).not.toHaveBeenCalled();
  });
});
