// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Trash2 } from "lucide-react";
import { BotonIcono } from "../BotonIcono";

describe("BotonIcono", () => {
  it("expone la etiqueta como nombre accesible", () => {
    render(<BotonIcono etiqueta="Eliminar" icono={<Trash2 />} />);
    const boton = screen.getByRole("button", { name: "Eliminar" });
    expect(boton).toHaveAttribute("title", "Eliminar");
  });

  it("dispara onClick", async () => {
    const onClick = vi.fn();
    render(<BotonIcono etiqueta="Eliminar" icono={<Trash2 />} onClick={onClick} />);
    await userEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
