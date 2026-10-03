// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import Tomos from "../page";

const { estado, claveSolicitada } = vi.hoisted(() => ({
  estado: {
    escuelaId: undefined as number | undefined,
    puedeElegirEscuela: false,
    escaneos: [] as unknown[],
  },
  claveSolicitada: { valor: undefined as string | null | undefined },
}));

vi.mock("@/hooks/useEscuelaActual", () => ({
  useEscuelaActual: () => ({
    escuelaId: estado.escuelaId,
    escuelas: [{ id: 5, nombre: "Escuela Central", codigoMep: "001", regionId: 1 }],
    puedeElegirEscuela: estado.puedeElegirEscuela,
  }),
}));

vi.mock("swr", () => ({
  default: (clave: string | null) => {
    claveSolicitada.valor = clave;
    return { data: clave ? estado.escaneos : undefined, isLoading: false, mutate: vi.fn() };
  },
}));

beforeEach(() => {
  estado.escuelaId = undefined;
  estado.puedeElegirEscuela = false;
  estado.escaneos = [];
  claveSolicitada.valor = undefined;
});

const escaneo = (numeroFolio: number) => ({
  id: numeroFolio,
  escuelaId: 5,
  numeroTomo: 1,
  numeroFolio,
  url: `k${numeroFolio}`,
  urlLectura: `/img/${numeroFolio}.png`,
  formato: "png",
  createdAt: "2026-01-01T00:00:00.000Z",
});

describe("Tomos — selección de escuela", () => {
  it("pide seleccionar una escuela y no consulta folios cuando Admin País no ha elegido ninguna", () => {
    estado.puedeElegirEscuela = true;

    render(<Tomos />);

    expect(screen.getByText("Seleccione una escuela")).toBeInTheDocument();
    expect(claveSolicitada.valor).toBeNull();
  });

  it("consulta los folios de la escuela del usuario y muestra el estado vacío del tomo", () => {
    estado.escuelaId = 5;

    render(<Tomos />);

    expect(screen.queryByText("Seleccione una escuela")).not.toBeInTheDocument();
    expect(claveSolicitada.valor).toBe("/api/escaneos?escuelaId=5&tomo=1");
    expect(screen.getByText("Sin folios digitalizados")).toBeInTheDocument();
  });
});

describe("Tomos — visor de folios", () => {
  it("no muta el arreglo de datos de SWR al ordenar", () => {
    estado.escuelaId = 5;
    const datos = [escaneo(3), escaneo(1), escaneo(2)];
    estado.escaneos = datos;

    render(<Tomos />);

    expect(datos.map((e) => e.numeroFolio)).toEqual([3, 1, 2]);
    expect(screen.getByText("Folio 1 de 3")).toBeInTheDocument();
  });

  it("navega entre folios con los botones y con las flechas del teclado", () => {
    estado.escuelaId = 5;
    estado.escaneos = [escaneo(1), escaneo(2), escaneo(3)];

    render(<Tomos />);

    fireEvent.click(screen.getByRole("button", { name: "Folio siguiente" }));
    expect(screen.getByText("Folio 2 de 3")).toBeInTheDocument();

    const visor = screen.getByRole("group", { name: "Visor de folios" });
    fireEvent.keyDown(visor, { key: "ArrowRight" });
    expect(screen.getByText("Folio 3 de 3")).toBeInTheDocument();
    fireEvent.keyDown(visor, { key: "ArrowLeft" });
    expect(screen.getByText("Folio 2 de 3")).toBeInTheDocument();
  });

  it("muestra la escuela como contexto y no duplica el selector en el formulario de subida", () => {
    estado.puedeElegirEscuela = true;

    render(<Tomos />);

    expect(screen.getAllByLabelText("Escuela")).toHaveLength(1);
  });
});
