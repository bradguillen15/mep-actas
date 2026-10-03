// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "../Header";

const { ruta } = vi.hoisted(() => ({ ruta: { actual: "/actas" } }));

vi.mock("next/navigation", () => ({ usePathname: () => ruta.actual }));

describe("Header", () => {
  it("muestra el título de la sección actual", () => {
    ruta.actual = "/actas/12";
    render(<Header menuAbierto={false} onAbrirMenu={vi.fn()} />);

    expect(screen.getByText("Actas")).toBeInTheDocument();
  });

  it("muestra el título de Ayuda", () => {
    ruta.actual = "/ayuda";
    render(<Header menuAbierto={false} onAbrirMenu={vi.fn()} />);

    expect(screen.getByText("Ayuda")).toBeInTheDocument();
  });

  it("no muestra título en rutas desconocidas", () => {
    ruta.actual = "/otra-cosa";
    render(<Header menuAbierto={false} onAbrirMenu={vi.fn()} />);

    expect(screen.queryByTestId("titulo-seccion")).not.toBeInTheDocument();
  });

  it("el botón de menú expone aria-expanded y aria-controls y abre el menú", async () => {
    const onAbrirMenu = vi.fn();
    ruta.actual = "/tomos";
    render(<Header menuAbierto={true} onAbrirMenu={onAbrirMenu} />);

    const boton = screen.getByRole("button", { name: "Abrir menú" });
    expect(boton).toHaveAttribute("aria-expanded", "true");
    expect(boton).toHaveAttribute("aria-controls", "cajon-navegacion");
    await userEvent.click(boton);
    expect(onAbrirMenu).toHaveBeenCalledTimes(1);
  });

  it("conserva el logo institucional", () => {
    ruta.actual = "/tomos";
    render(<Header menuAbierto={false} onAbrirMenu={vi.fn()} />);

    expect(screen.getByRole("img", { name: /Ministerio de Educación Pública/ })).toBeInTheDocument();
  });
});
