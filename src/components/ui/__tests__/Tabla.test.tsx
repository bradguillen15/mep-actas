// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ColumnDef } from "@tanstack/react-table";
import { Tabla } from "../Tabla";

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
    expect(screen.getByText("2").closest("td")).toHaveClass("text-right");
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
});
