// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "../Header";
import { EncabezadoShellProvider } from "@/contextos/EncabezadoShellContext";
import { useRegistrarEncabezado } from "@/contextos/EncabezadoShellContext";

const { ruta } = vi.hoisted(() => ({ ruta: { actual: "/actas" } }));

vi.mock("next/navigation", () => ({ usePathname: () => ruta.actual }));

function conProveedor(ui: React.ReactNode) {
  return <EncabezadoShellProvider>{ui}</EncabezadoShellProvider>;
}

function Registrar({
  titulo,
  descripcion,
}: {
  titulo: string;
  descripcion?: string;
}) {
  useRegistrarEncabezado(titulo, descripcion);
  return null;
}

describe("Header", () => {
  it("muestra el título de la sección actual como h1", () => {
    ruta.actual = "/actas/12";
    render(conProveedor(<Header menuAbierto={false} onAbrirMenu={vi.fn()} />));

    expect(screen.getByRole("heading", { level: 1, name: "Actas" })).toBeInTheDocument();
  });

  it("muestra el título de Ayuda", () => {
    ruta.actual = "/ayuda";
    render(conProveedor(<Header menuAbierto={false} onAbrirMenu={vi.fn()} />));

    expect(screen.getByRole("heading", { level: 1, name: "Ayuda" })).toBeInTheDocument();
  });

  it("prioriza el título y la descripción registrados por la página", () => {
    ruta.actual = "/actas";
    render(
      conProveedor(
        <>
          <Registrar
            titulo="Nueva acta"
            descripcion="Registre un acta de graduación."
          />
          <Header menuAbierto={false} onAbrirMenu={vi.fn()} />
        </>
      )
    );

    expect(screen.getByRole("heading", { level: 1, name: "Nueva acta" })).toBeInTheDocument();
    expect(screen.getByText("Registre un acta de graduación.")).toBeInTheDocument();
  });

  it("no muestra título en rutas desconocidas sin registro", () => {
    ruta.actual = "/otra-cosa";
    render(conProveedor(<Header menuAbierto={false} onAbrirMenu={vi.fn()} />));

    expect(screen.queryByTestId("titulo-seccion")).not.toBeInTheDocument();
  });

  it("el botón de menú expone aria-expanded y aria-controls y abre el menú", async () => {
    const onAbrirMenu = vi.fn();
    ruta.actual = "/tomos";
    render(conProveedor(<Header menuAbierto={true} onAbrirMenu={onAbrirMenu} />));

    const boton = screen.getByRole("button", { name: "Abrir menú" });
    expect(boton).toHaveAttribute("aria-expanded", "true");
    expect(boton).toHaveAttribute("aria-controls", "cajon-navegacion");
    await userEvent.click(boton);
    expect(onAbrirMenu).toHaveBeenCalledTimes(1);
  });

  it("no repite el logo institucional, que vive en la barra lateral", () => {
    ruta.actual = "/tomos";
    render(conProveedor(<Header menuAbierto={false} onAbrirMenu={vi.fn()} />));

    expect(screen.queryByRole("img", { hidden: true })).not.toBeInTheDocument();
  });
});
