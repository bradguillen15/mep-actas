// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Boton } from "../Boton";

describe("Boton", () => {
  it("renderiza el hijo como enlace con asChild", () => {
    render(
      <Boton asChild>
        <a href="/actas">Ver actas</a>
      </Boton>
    );
    expect(screen.getByRole("link", { name: "Ver actas" })).toHaveAttribute("href", "/actas");
  });

  it("se deshabilita y expone aria-busy mientras carga", () => {
    render(<Boton cargando>Guardar</Boton>);
    const boton = screen.getByRole("button", { name: /Guardar/ });
    expect(boton).toBeDisabled();
    expect(boton).toHaveAttribute("aria-busy", "true");
  });
});
