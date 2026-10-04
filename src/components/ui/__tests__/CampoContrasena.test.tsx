// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CampoContrasena } from "../CampoContrasena";

describe("CampoContrasena", () => {
  it("asocia la etiqueta y oculta la contraseña por defecto", () => {
    render(<CampoContrasena label="Contraseña" />);
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("type", "password");
  });

  it("alterna la visibilidad con un botón accesible", async () => {
    render(<CampoContrasena label="Contraseña" />);
    const boton = screen.getByRole("button", { name: "Mostrar contraseña" });
    expect(boton).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(boton);

    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("type", "text");
    const botonOcultar = screen.getByRole("button", { name: "Ocultar contraseña" });
    expect(botonOcultar).toHaveAttribute("aria-pressed", "true");
  });

  it("anuncia el error y marca el campo inválido", () => {
    render(<CampoContrasena label="Contraseña" error="Obligatoria" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Obligatoria");
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("CampoContrasena — ayuda y requerido", () => {
  it("asocia el texto de ayuda y marca el campo como requerido", () => {
    render(<CampoContrasena label="Clave" ayuda="Mínimo 12 caracteres." requerido />);
    const campo = screen.getByLabelText(/Clave/);
    expect(campo).toHaveAttribute("aria-required", "true");
    const ayuda = screen.getByText("Mínimo 12 caracteres.");
    expect(campo.getAttribute("aria-describedby")).toContain(ayuda.id);
  });
});
