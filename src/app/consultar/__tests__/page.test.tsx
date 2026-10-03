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
  default: (_clave: string, _fetcher: unknown, opciones: unknown) => {
    opcionesSwr.valor = opciones;
    return { ...estado, mutate: mutarMock };
  },
}));

const escuelaActualMock = vi.hoisted(() => ({
  valor: {
    escuelaId: 5 as number | undefined,
    escuelas: [] as { id: number; nombre: string }[],
    puedeElegirEscuela: false,
  },
}));

vi.mock("@/hooks/useEscuelaActual", () => ({
  useEscuelaActual: () => escuelaActualMock.valor,
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
  escuelaActualMock.valor = {
    escuelaId: 5,
    escuelas: [],
    puedeElegirEscuela: false,
  };
});

describe("Consultar — búsqueda", () => {
  it("expone un solo campo con ayuda y fechas visibles", async () => {
    conResultados([graduacion]);
    render(<Consultar />);

    expect(
      screen.getByRole("textbox", { name: "Búsqueda avanzada" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Busca a la vez en cédula/ })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Fecha desde")).toBeInTheDocument();
    expect(screen.getByLabelText("Fecha hasta")).toBeInTheDocument();
    expect(screen.queryByLabelText("N° certificado")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Tipo de acta")).not.toBeInTheDocument();

    const campo = screen.getByRole("textbox", { name: "Búsqueda avanzada" });
    expect(
      screen.queryByRole("button", { name: "Limpiar búsqueda" })
    ).not.toBeInTheDocument();

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

  it("muestra la escuela como primer filtro solo si el admin puede elegirla", () => {
    conResultados([graduacion]);
    const { rerender } = render(<Consultar />);
    expect(screen.queryByLabelText("Escuela")).not.toBeInTheDocument();

    escuelaActualMock.valor = {
      escuelaId: undefined,
      escuelas: [{ id: 10, nombre: "Escuela Central" }],
      puedeElegirEscuela: true,
    };
    rerender(<Consultar />);

    const escuela = screen.getByLabelText("Escuela");
    const busqueda = screen.getByRole("textbox", { name: "Búsqueda avanzada" });
    expect(
      escuela.compareDocumentPosition(busqueda) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
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

    await userEvent.type(
      screen.getByRole("textbox", { name: "Búsqueda avanzada" }),
      "zzz"
    );

    expect(
      screen.getByText("No se encontraron graduaciones con los criterios ingresados.")
    ).toBeInTheDocument();
    const botonesLimpiar = screen.getAllByRole("button", {
      name: "Limpiar filtros",
    });
    await userEvent.click(botonesLimpiar[0]!);
    expect(screen.getByRole("textbox", { name: "Búsqueda avanzada" })).toHaveValue(
      ""
    );
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
