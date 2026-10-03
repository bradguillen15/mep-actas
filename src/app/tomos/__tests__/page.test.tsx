// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Tomos from "../page";

const { estado, claveSolicitada } = vi.hoisted(() => ({
  estado: {
    escuelaId: undefined as number | undefined,
    puedeElegirEscuela: false,
    escaneos: [] as unknown[],
    resumenTomos: [] as { numeroTomo: number; cantidadFolios: number }[] | undefined,
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
    if (clave?.startsWith("/api/escaneos/tomos")) {
      return {
        data: estado.resumenTomos,
        isLoading: estado.resumenTomos === undefined,
        error: undefined,
        mutate: vi.fn(),
      };
    }
    claveSolicitada.valor = clave;
    return {
      data: clave ? estado.escaneos : undefined,
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    };
  },
}));

beforeEach(() => {
  estado.escuelaId = undefined;
  estado.puedeElegirEscuela = false;
  estado.escaneos = [];
  estado.resumenTomos = [];
  claveSolicitada.valor = undefined;
});

const escaneo = (numeroFolio: number, numeroTomo = 12) => ({
  id: numeroFolio,
  escuelaId: 5,
  numeroTomo,
  numeroFolio,
  url: `k${numeroFolio}`,
  urlLectura: `/img/${numeroFolio}.png`,
  formato: "png",
  createdAt: "2026-01-01T00:00:00.000Z",
});

describe("Tomos — selección de escuela", () => {
  it("pide seleccionar una escuela y no consulta folios cuando Admin País no ha elegido ninguna", () => {
    estado.puedeElegirEscuela = true;
    estado.resumenTomos = undefined;

    render(<Tomos />);

    expect(screen.getByText("Seleccione una escuela")).toBeInTheDocument();
    expect(claveSolicitada.valor).toBeNull();
  });

  it("muestra los tomos disponibles y abre el primero automáticamente", async () => {
    estado.escuelaId = 5;
    estado.resumenTomos = [
      { numeroTomo: 12, cantidadFolios: 18 },
      { numeroTomo: 14, cantidadFolios: 15 },
    ];
    estado.escaneos = [escaneo(1), escaneo(2)];

    render(<Tomos />);

    expect(screen.getByRole("group", { name: "Tomos disponibles" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tomo 12/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: /Tomo 14/ })).toHaveAttribute(
      "aria-pressed",
      "false"
    );

    await waitFor(() => {
      expect(claveSolicitada.valor).toBe("/api/escaneos?escuelaId=5&tomo=12");
    });
  });

  it("al cambiar de tomo consulta los folios de ese tomo", async () => {
    estado.escuelaId = 5;
    estado.resumenTomos = [
      { numeroTomo: 12, cantidadFolios: 18 },
      { numeroTomo: 14, cantidadFolios: 15 },
    ];
    estado.escaneos = [escaneo(1)];

    render(<Tomos />);

    fireEvent.click(screen.getByRole("button", { name: /Tomo 14/ }));

    await waitFor(() => {
      expect(claveSolicitada.valor).toBe("/api/escaneos?escuelaId=5&tomo=14");
    });
    expect(screen.getByRole("button", { name: /Tomo 14/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("si la escuela no tiene tomos, muestra vacío sin consultar un tomo inventado", () => {
    estado.escuelaId = 5;
    estado.resumenTomos = [];

    render(<Tomos />);

    expect(screen.getByText("Sin tomos digitalizados")).toBeInTheDocument();
    expect(claveSolicitada.valor).toBeNull();
  });
});

describe("Tomos — visor de folios", () => {
  it("no muta el arreglo de datos de SWR al ordenar", () => {
    estado.escuelaId = 5;
    estado.resumenTomos = [{ numeroTomo: 12, cantidadFolios: 3 }];
    const datos = [escaneo(3), escaneo(1), escaneo(2)];
    estado.escaneos = datos;

    render(<Tomos />);

    expect(datos.map((e) => e.numeroFolio)).toEqual([3, 1, 2]);
    expect(screen.getByText("Folio 1 de 3")).toBeInTheDocument();
  });

  it("navega entre folios con los botones y con las flechas del teclado", () => {
    estado.escuelaId = 5;
    estado.resumenTomos = [{ numeroTomo: 12, cantidadFolios: 3 }];
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
    estado.resumenTomos = undefined;

    render(<Tomos />);

    expect(screen.getAllByLabelText("Escuela")).toHaveLength(1);
  });
});
