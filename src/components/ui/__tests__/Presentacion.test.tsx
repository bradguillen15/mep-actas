// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EncabezadoPagina } from "../EncabezadoPagina";
import { ListaDefiniciones } from "../ListaDefiniciones";
import { EstadoVacio } from "../EstadoVacio";

describe("EncabezadoPagina", () => {
  it("muestra título, descripción, acciones y enlace de regreso", () => {
    render(
      <EncabezadoPagina
        titulo="Actas"
        descripcion="Listado"
        acciones={<button>Nueva</button>}
        volverA={{ href: "/actas", etiqueta: "Volver a actas" }}
      />
    );
    expect(screen.getByRole("heading", { level: 1, name: "Actas" })).toBeInTheDocument();
    expect(screen.getByText("Listado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nueva" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Volver a actas/ })).toHaveAttribute("href", "/actas");
  });
});

describe("ListaDefiniciones", () => {
  it("renderiza pares etiqueta y valor", () => {
    render(<ListaDefiniciones elementos={[{ etiqueta: "Tomo", valor: "12" }]} />);
    expect(screen.getByText("Tomo").tagName).toBe("DT");
    expect(screen.getByText("12").tagName).toBe("DD");
  });
});

describe("EstadoVacio", () => {
  it("muestra la acción opcional y el mensaje", () => {
    render(<EstadoVacio mensaje="Sin actas" accion={<button>Crear</button>} />);
    expect(screen.getByText("Sin actas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear" })).toBeInTheDocument();
  });

  it("la variante error anuncia el mensaje como alerta", () => {
    render(<EstadoVacio variante="error" mensaje="Falló la carga" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Falló la carga");
  });
});
