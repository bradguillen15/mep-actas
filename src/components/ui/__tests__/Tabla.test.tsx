// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ColumnDef } from "@tanstack/react-table";
import { Tabla } from "../Tabla";

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        key: index,
        start: index * 53,
        end: (index + 1) * 53,
        size: 53,
      })),
    getTotalSize: () => count * 53,
  }),
}));

const matchMediaOriginal = window.matchMedia;

afterEach(() => {
  window.matchMedia = matchMediaOriginal;
});

interface Fila {
  nombre: string;
  monto: number;
}

const columnas: ColumnDef<Fila>[] = [
  { accessorKey: "nombre", header: "Nombre" },
  { accessorKey: "monto", header: "Monto", meta: { className: "text-right" } },
];

const datos: Fila[] = [
  { nombre: "Ana", monto: 2 },
  { nombre: "Beto", monto: 1 },
];

describe("Tabla", () => {
  it("activa la fila con Enter y Espacio", async () => {
    const onFilaClick = vi.fn();
    render(<Tabla columnas={columnas} datos={datos} onFilaClick={onFilaClick} />);
    const fila = screen.getByText("Ana").closest("tr") as HTMLElement;
    expect(fila).toHaveAttribute("tabindex", "0");
    fila.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(onFilaClick).toHaveBeenCalledTimes(2);
    expect(onFilaClick).toHaveBeenCalledWith(datos[0]);
  });

  it("no hace enfocables las filas sin onFilaClick", () => {
    render(<Tabla columnas={columnas} datos={datos} />);
    expect(screen.getByText("Ana").closest("tr")).not.toHaveAttribute("tabindex");
  });

  it("expone aria-sort y un botón en los encabezados ordenables", async () => {
    render(<Tabla columnas={columnas} datos={datos} />);
    const th = screen.getByRole("columnheader", { name: /Nombre/ });
    expect(th).toHaveAttribute("aria-sort", "none");
    await userEvent.click(within(th).getByRole("button"));
    expect(th).toHaveAttribute("aria-sort", "ascending");
    await userEvent.click(within(th).getByRole("button"));
    expect(th).toHaveAttribute("aria-sort", "descending");
  });

  it("aplica meta.className a encabezado y celdas", () => {
    render(<Tabla columnas={columnas} datos={datos} />);
    expect(screen.getByRole("columnheader", { name: /Monto/ })).toHaveClass("text-right");
    const filaAna = screen.getByText("Ana").closest("tr")!;
    expect(within(filaAna).getByText("2").closest("td")).toHaveClass("text-right");
  });

  it("muestra esqueleto y conserva el encabezado mientras carga", () => {
    const { container } = render(<Tabla columnas={columnas} datos={[]} cargando />);
    expect(screen.getByRole("columnheader", { name: /Nombre/ })).toBeInTheDocument();
    expect(container.querySelectorAll("tbody tr")).toHaveLength(5);
  });

  it("muestra el contenido vacío cuando no hay datos", () => {
    render(<Tabla columnas={columnas} datos={[]} vacio={<p>Sin resultados</p>} />);
    expect(screen.getByText("Sin resultados")).toBeInTheDocument();
  });

  it("no muestra el contenido vacío mientras carga", () => {
    render(<Tabla columnas={columnas} datos={[]} cargando vacio={<p>Sin resultados</p>} />);
    expect(screen.queryByText("Sin resultados")).not.toBeInTheDocument();
  });

  it("usa un contenedor con scroll interno", () => {
    render(<Tabla columnas={columnas} datos={datos} />);
    const contenedor = screen.getByTestId("tabla-contenedor");
    expect(contenedor).toHaveClass("overflow-hidden");
    expect(contenedor).toHaveClass("flex-1");
    expect(contenedor.querySelector(".overflow-auto")).not.toBeNull();
  });

  it("numera las filas empezando en 1", () => {
    render(<Tabla columnas={columnas} datos={datos} />);
    const filas = screen.getAllByRole("row").slice(1);
    expect(within(filas[0]).getByText("1")).toBeInTheDocument();
    expect(within(filas[1]).getByText("2")).toBeInTheDocument();
  });

  it("numera con desplazamiento cuando hay indiceInicio", () => {
    render(
      <Tabla
        columnas={columnas}
        datos={datos}
        paginacion={false}
        indiceInicio={20}
      />
    );
    const filas = screen.getAllByRole("row").slice(1);
    expect(within(filas[0]).getByText("21")).toBeInTheDocument();
    expect(within(filas[1]).getByText("22")).toBeInTheDocument();
  });

  it("permite cambiar el tamaño de página", async () => {
    const muchas: Fila[] = Array.from({ length: 25 }, (_, i) => ({
      nombre: `Persona ${i + 1}`,
      monto: i,
    }));
    render(<Tabla columnas={columnas} datos={muchas} />);

    expect(screen.getByText("Persona 1")).toBeInTheDocument();
    expect(screen.queryByText("Persona 21")).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("combobox", { name: "Registros por página" })
    );
    await userEvent.click(await screen.findByRole("option", { name: "50" }));

    expect(screen.getByText("Persona 21")).toBeInTheDocument();
  });

  it("en vista compacta muestra tarjetas en lugar de la tabla", () => {
    window.matchMedia = vi.fn().mockImplementation((consulta: string) => ({
      matches: !consulta.includes("min-width: 768px"),
      media: consulta,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    }));

    render(<Tabla columnas={columnas} datos={datos} />);

    expect(screen.getByRole("list", { name: "Lista de registros" })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
  });
});
