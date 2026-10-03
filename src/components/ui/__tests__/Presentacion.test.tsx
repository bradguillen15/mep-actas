// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EncabezadoPagina } from "../EncabezadoPagina";
import { ListaDefiniciones } from "../ListaDefiniciones";
import { EstadoVacio } from "../EstadoVacio";
import { EncabezadoShellProvider } from "@/contextos/EncabezadoShellContext";
import { Header } from "@/components/layout/Header";

vi.mock("next/navigation", () => ({ usePathname: () => "/actas" }));

describe("EncabezadoPagina", () => {
  it("registra el título en el header y solo muestra acciones y enlace de regreso", () => {
    render(
      <EncabezadoShellProvider>
        <Header menuAbierto={false} onAbrirMenu={() => {}} />
        <EncabezadoPagina
          titulo="Actas"
          descripcion="Listado"
          acciones={<button>Nueva</button>}
          volverA={{ href: "/actas", etiqueta: "Volver a actas" }}
        />
      </EncabezadoShellProvider>
    );
    expect(screen.getByRole("heading", { level: 1, name: "Actas" })).toBeInTheDocument();
    expect(screen.getByText("Listado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nueva" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Volver a actas/ })).toHaveAttribute("href", "/actas");
  });

  it("no renderiza contenedor cuando solo registra título y descripción", () => {
    const { container } = render(
      <EncabezadoShellProvider>
        <EncabezadoPagina titulo="Usuarios" descripcion="Gestione las cuentas." />
      </EncabezadoShellProvider>
    );
    expect(container.querySelector("h1")).toBeNull();
    expect(container.textContent).toBe("");
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
