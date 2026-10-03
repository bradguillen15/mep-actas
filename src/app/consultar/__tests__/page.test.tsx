// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Consultar from "../page";

const graduacion = {
  id: 1,
  nombreCompleto: "María Pérez Soto",
  identificacion: "101110111",
  escuela: "Escuela Central",
  tipoActa: "Primaria",
  fecha: "2024-12-10T00:00:00.000Z",
  numeroCertificado: 5001,
  actaId: 7,
  tituloActa: "Acta de graduación 2024",
};

const { estado, mutarMock, opcionesSwr } = vi.hoisted(() => ({
  estado: {
    data: undefined as unknown,
    error: undefined as unknown,
    isLoading: false,
    isValidating: false,
  },
  mutarMock: vi.fn(),
  opcionesSwr: { valor: undefined as unknown },
}));

vi.mock("swr", () => ({
  default: (clave: string, _fetcher: unknown, opciones: unknown) => {
    if (clave === "/api/tipos-acta") {
      return { data: [{ id: 1, nombre: "Primaria" }] };
    }
    opcionesSwr.valor = opciones;
    return { ...estado, mutate: mutarMock };
  },
}));

vi.mock("@/hooks/useEscuelaActual", () => ({
  useEscuelaActual: () => ({
    escuelaId: 5,
    escuelas: [],
    puedeElegirEscuela: false,
  }),
}));

vi.mock("@/hooks/useDebouncedValue", () => ({
  useDebouncedValue: (valor: unknown) => valor,
}));

function conResultados(datos: unknown[]) {
  estado.data = { datos, total: datos.length, pagina: 1, limite: 20 };
}

beforeEach(() => {
  estado.data = undefined;
  estado.error = undefined;
  estado.isLoading = false;
  estado.isValidating = false;
  mutarMock.mockReset();
  opcionesSwr.valor = undefined;
});

describe("Consultar — búsqueda", () => {
  it("expone la búsqueda con nombre accesible y botón de limpiar solo con texto", async () => {
    conResultados([graduacion]);
    render(<Consultar />);

    const campo = screen.getByRole("textbox", { name: "Buscar graduados" });
    expect(screen.queryByRole("button", { name: "Limpiar búsqueda" })).not.toBeInTheDocument();

    await userEvent.type(campo, "mar");
    await userEvent.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));

    expect(campo).toHaveValue("");
    expect(campo).toHaveFocus();
  });

  it("mantiene los datos previos al revalidar", () => {
    conResultados([graduacion]);
    render(<Consultar />);
    expect(opcionesSwr.valor).toMatchObject({ keepPreviousData: true });
  });
});

describe("Consultar — búsqueda avanzada", () => {
  it("informa expansión con aria-expanded y cuenta los filtros activos", async () => {
    conResultados([graduacion]);
    render(<Consultar />);

    const boton = screen.getByRole("button", { name: /Búsqueda avanzada/ });
    expect(boton).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(boton);
    expect(boton).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(boton.getAttribute("aria-controls")!)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("N° certificado"), "5001");
    expect(within(boton).getByText("1")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(screen.getByLabelText("N° certificado")).toHaveValue("");
    expect(screen.queryByRole("button", { name: "Limpiar filtros" })).not.toBeInTheDocument();
  });
});

describe("Consultar — estados", () => {
  it("muestra el estado de error con reintento cuando falla la consulta", async () => {
    estado.error = new Error("fallo");
    render(<Consultar />);

    expect(screen.getByRole("alert")).toHaveTextContent(/No se pudo cargar/);
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(mutarMock).toHaveBeenCalled();
  });

  it("ofrece limpiar filtros cuando no hay resultados con filtros activos", async () => {
    conResultados([]);
    render(<Consultar />);

    expect(screen.queryByRole("button", { name: "Limpiar filtros" })).not.toBeInTheDocument();
    expect(screen.getByText("No hay graduados registrados todavía.")).toBeInTheDocument();

    await userEvent.type(screen.getByRole("textbox", { name: "Buscar graduados" }), "zzz");

    expect(
      screen.getByText("No se encontraron graduaciones con los criterios ingresados.")
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(screen.getByRole("textbox", { name: "Buscar graduados" })).toHaveValue("");
  });
});

describe("Consultar — detalle", () => {
  it("abre el detalle con lista de definiciones y enlace a la acta", async () => {
    conResultados([graduacion]);
    render(<Consultar />);

    await userEvent.click(screen.getByText("María Pérez Soto"));

    const dialogo = await screen.findByRole("dialog");
    expect(within(dialogo).getByText("Nombre completo").tagName).toBe("DT");
    const enlace = within(dialogo).getByRole("link", { name: "Ver acta" });
    expect(enlace).toHaveAttribute("href", "/actas/7");
  });
});
