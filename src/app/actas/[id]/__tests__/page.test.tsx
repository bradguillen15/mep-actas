// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import EditarActa from "../page";

const { estado, mutarMock } = vi.hoisted(() => ({
  estado: {
    detalle: { data: undefined as unknown, error: undefined as unknown, isLoading: false },
  },
  mutarMock: vi.fn(),
}));

vi.mock("swr", () => ({
  default: (clave: string | null) => {
    if (clave === "/api/tipos-acta") {
      return { data: [{ id: 1, nombre: "Certificado" }] };
    }
    return { ...estado.detalle, mutate: mutarMock };
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ id: "7" }),
}));

vi.mock("@/hooks/useEscuelaActual", () => ({
  useEscuelaActual: () => ({
    escuelaId: 5,
    escuelas: [],
    puedeElegirEscuela: false,
    isLoading: false,
  }),
}));

beforeEach(() => {
  estado.detalle = { data: undefined, error: undefined, isLoading: false };
  mutarMock.mockReset();
});

describe("EditarActa", () => {
  it("muestra un estado de error con reintento y regreso cuando falla la carga", () => {
    estado.detalle = { data: undefined, error: new Error("Error 404"), isLoading: false };
    render(<EditarActa />);

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cargar el acta");
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver todas las actas" })).toHaveAttribute("href", "/actas");
  });

  it("muestra esqueletos mientras carga", () => {
    estado.detalle = { data: undefined, error: undefined, isLoading: true };
    render(<EditarActa />);

    expect(screen.getByRole("status", { name: "Cargando acta" })).toBeInTheDocument();
  });

  it("muestra los campos editables y Agregar estudiante al cargar, sin modo vista", () => {
    estado.detalle = {
      data: {
        acta: {
          id: 7,
          escuelaId: 5,
          tipoActaId: 1,
          titulo: "Acta 7",
          numeroTomo: 3,
          folioInicio: 1,
          folioFin: 8,
          fecha: "2024-12-10T00:00:00.000Z",
          actaReferenciaId: null,
        },
        estudiantes: [],
      },
      error: undefined,
      isLoading: false,
    };
    render(<EditarActa />);

    expect(screen.getByLabelText(/Título/)).toHaveValue("Acta 7");
    expect(screen.getByLabelText(/Folio fin/)).toHaveValue(8);
    expect(screen.getByRole("button", { name: /Agregar estudiante/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Listo" })).not.toBeInTheDocument();
  });
});
