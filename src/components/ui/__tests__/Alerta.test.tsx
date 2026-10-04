// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Alerta } from "../Alerta";

describe("Alerta", () => {
  it("usa role alert para error y advertencia", () => {
    const { rerender } = render(<Alerta variante="error">Falló</Alerta>);
    expect(screen.getByRole("alert")).toHaveTextContent("Falló");
    rerender(<Alerta variante="advertencia">Cuidado</Alerta>);
    expect(screen.getByRole("alert")).toHaveTextContent("Cuidado");
  });

  it("usa role status para éxito e info", () => {
    const { rerender } = render(<Alerta variante="exito">Listo</Alerta>);
    expect(screen.getByRole("status")).toHaveTextContent("Listo");
    rerender(<Alerta variante="info">Dato</Alerta>);
    expect(screen.getByRole("status")).toHaveTextContent("Dato");
  });
});
