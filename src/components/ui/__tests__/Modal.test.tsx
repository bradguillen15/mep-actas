// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Modal } from "../Modal";

afterEach(() => vi.restoreAllMocks());

describe("Modal", () => {
  it("asocia la descripción al diálogo con aria-describedby", () => {
    render(
      <Modal abierto onCerrar={vi.fn()} titulo="Título" descripcion="Texto descriptivo" />
    );

    const dialogo = screen.getByRole("dialog");
    const descripcion = screen.getByText("Texto descriptivo");
    expect(descripcion.id).not.toBe("");
    expect(dialogo).toHaveAttribute("aria-describedby", descripcion.id);
  });

  it("sin descripción no declara aria-describedby ni advierte", () => {
    const advertencia = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Modal abierto onCerrar={vi.fn()} titulo="Título" />);

    expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-describedby");
    expect(advertencia).not.toHaveBeenCalled();
  });
});
