// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import Actas from "../page";

const { estado, mutarMock } = vi.hoisted(() => ({
  estado: {
    tipos: [{ id: 1, nombre: "Certificado de Graduación" }] as unknown,
    actas: { data: undefined as unknown, error: undefined as unknown, isLoading: false },
  },
  mutarMock: vi.fn(),
}));

vi.mock("swr", () => ({
  default: (clave: string) => {
    if (clave === "/api/tipos-acta") {
      return { data: estado.tipos };
    }
    return { ...estado.actas, mutate: mutarMock };
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/hooks/useEscuelaActual", () => ({
  useEscuelaActual: () => ({
    escuelaId: 5,
    escuelas: [],
    puedeElegirEscuela: false,
  }),
}));

const acta = {
  id: 7,
  escuelaId: 5,
  tipoActaId: 1,
  titulo: "Acta 001-2025",
  numeroTomo: 3,
  folioInicio: 1,
  folioFin: 8,
  fecha: "2025-02-10T00:00:00.000Z",
  actaReferenciaId: null,
};

beforeEach(() => {
  estado.actas = { data: undefined, error: undefined, isLoading: false };
  estado.tipos = [{ id: 1, nombre: "Certificado de Graduación" }];
  mutarMock.mockReset();
});

describe("Actas — listado", () => {
  it("ofrece Nueva acta como enlace sin botón anidado", () => {
    estado.actas = { data: [acta], error: undefined, isLoading: false };
    render(<Actas />);

    const enlace = screen.getByRole("link", { name: "Nueva acta" });
    expect(enlace).toHaveAttribute("href", "/actas/nueva");
    expect(within(enlace).queryByRole("button")).not.toBeInTheDocument();
    expect(enlace.closest("button")).toBeNull();
  });

  it("muestra el título como enlace al detalle, el tipo y los folios", () => {
    estado.actas = { data: [acta], error: undefined, isLoading: false };
    render(<Actas />);

    expect(screen.getByRole("link", { name: "Acta 001-2025" })).toHaveAttribute("href", "/actas/7");
    expect(screen.getByText("Certificado de Graduación")).toBeInTheDocument();
    expect(screen.getByText("1–8")).toBeInTheDocument();
    expect(screen.queryByText("N° de acta")).not.toBeInTheDocument();
  });

  it("muestra el estado de error con reintento", () => {
    estado.actas = { data: undefined, error: new Error("Error 500"), isLoading: false };
    render(<Actas />);

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudieron cargar las actas");
    screen.getByRole("button", { name: "Reintentar" }).click();
    expect(mutarMock).toHaveBeenCalled();
  });

  it("muestra el estado vacío con la acción de crear", () => {
    estado.actas = { data: [], error: undefined, isLoading: false };
    render(<Actas />);

    expect(screen.getByText("Aún no hay actas registradas")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Nueva acta" })).toHaveLength(2);
  });

  it("no muestra filtros si no puede elegir escuela", () => {
    estado.actas = { data: [acta], error: undefined, isLoading: false };
    render(<Actas />);

    expect(screen.queryByLabelText("Escuela")).not.toBeInTheDocument();
  });

  it("muestra el tipo aunque los tipos de acta carguen después que las actas", () => {
    const datosActas = [acta];
    estado.actas = { data: datosActas, error: undefined, isLoading: false };
    estado.tipos = undefined;
    const { rerender } = render(<Actas />);
    expect(screen.queryByText("Certificado de Graduación")).not.toBeInTheDocument();

    estado.tipos = [{ id: 1, nombre: "Certificado de Graduación" }];
    rerender(<Actas />);

    expect(screen.getByText("Certificado de Graduación")).toBeInTheDocument();
  });
});
