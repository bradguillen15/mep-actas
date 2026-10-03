// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Trash2 } from "lucide-react";
import { BotonIcono } from "../BotonIcono";

describe("BotonIcono", () => {
  it("expone la etiqueta como nombre accesible y tooltip", async () => {
    const usuario = userEvent.setup();
    render(<BotonIcono etiqueta="Eliminar" icono={<Trash2 />} />);
    const boton = screen.getByRole("button", { name: "Eliminar" });
    expect(boton).not.toHaveAttribute("title");

    await usuario.hover(boton);
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Eliminar");
  });

  it("dispara onClick", async () => {
    const onClick = vi.fn();
    render(
      <BotonIcono etiqueta="Eliminar" icono={<Trash2 />} onClick={onClick} />
    );
    await userEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("muestra el tooltip aunque esté deshabilitado", async () => {
    const usuario = userEvent.setup();
    render(
      <BotonIcono etiqueta="Folio anterior" icono={<Trash2 />} disabled />
    );

    await usuario.hover(screen.getByRole("button", { name: "Folio anterior" }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Folio anterior"
    );
  });
});
