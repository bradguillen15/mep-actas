// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Campo } from "../Campo";

describe("Campo", () => {
  it("asocia la etiqueta con el campo mediante un id generado", () => {
    render(<Campo label="Nombre" />);
    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
  });

  it("respeta el id recibido", () => {
    render(<Campo label="Nombre" id="mi-id" />);
    expect(screen.getByLabelText("Nombre")).toHaveAttribute("id", "mi-id");
  });

  it("marca el campo como requerido y oculta el asterisco a los lectores", () => {
    render(<Campo label="Nombre" requerido />);
    expect(screen.getByLabelText(/Nombre/)).toHaveAttribute("aria-required", "true");
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
  });

  it("vincula el texto de ayuda con aria-describedby", () => {
    render(<Campo label="Nombre" ayuda="Nombre completo" />);
    const campo = screen.getByLabelText("Nombre");
    const ayuda = screen.getByText("Nombre completo");
    expect(campo.getAttribute("aria-describedby")).toContain(ayuda.id);
  });

  it("anuncia el error, lo vincula y marca el campo inválido", () => {
    render(<Campo label="Nombre" error="Obligatorio" />);
    const campo = screen.getByLabelText("Nombre");
    const alerta = screen.getByRole("alert");
    expect(alerta).toHaveTextContent("Obligatorio");
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo.getAttribute("aria-describedby")).toContain(alerta.id);
  });

  it("no tiene aria-describedby sin ayuda ni error", () => {
    render(<Campo label="Nombre" />);
    expect(screen.getByLabelText("Nombre")).not.toHaveAttribute("aria-describedby");
  });
});
