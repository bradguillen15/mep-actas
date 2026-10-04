// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pestanas } from "../Pestanas";

const pestanas = [
  { id: "a", etiqueta: "Alfa" },
  { id: "b", etiqueta: "Beta" },
  { id: "c", etiqueta: "Gamma" },
];

describe("Pestanas", () => {
  it("expone la semántica de tablist, tab y tabpanel enlazados", () => {
    render(
      <Pestanas etiqueta="Secciones" pestanas={pestanas} activa="b" onCambiar={vi.fn()}>
        <p>Contenido beta</p>
      </Pestanas>
    );

    expect(screen.getByRole("tablist", { name: "Secciones" })).toBeInTheDocument();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Alfa", "Beta", "Gamma"]);
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
    expect(tabs.map((t) => t.getAttribute("tabindex"))).toEqual(["-1", "0", "-1"]);
    expect(tabs[1]).toHaveAttribute("type", "button");

    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAttribute("aria-labelledby", tabs[1].id);
    expect(tabs[1]).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveTextContent("Contenido beta");
  });

  it("cambia de pestaña con clic", async () => {
    const onCambiar = vi.fn();
    render(
      <Pestanas etiqueta="Secciones" pestanas={pestanas} activa="a" onCambiar={onCambiar}>
        <p>x</p>
      </Pestanas>
    );
    await userEvent.click(screen.getByRole("tab", { name: "Gamma" }));
    expect(onCambiar).toHaveBeenCalledWith("c");
  });

  it("navega con flechas, Home y End, y mueve el foco", async () => {
    const onCambiar = vi.fn();
    const Arnes = () => {
      const [activa, setActiva] = useState("a");
      return (
        <Pestanas
          etiqueta="Secciones"
          pestanas={pestanas}
          activa={activa}
          onCambiar={(id) => {
            onCambiar(id);
            setActiva(id);
          }}
        >
          <p>x</p>
        </Pestanas>
      );
    };
    render(<Arnes />);
    const [alfa, beta, gamma] = screen.getAllByRole("tab");
    alfa.focus();

    await userEvent.keyboard("{ArrowRight}");
    expect(onCambiar).toHaveBeenLastCalledWith("b");
    expect(beta).toHaveFocus();

    await userEvent.keyboard("{End}");
    expect(onCambiar).toHaveBeenLastCalledWith("c");
    expect(gamma).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");
    expect(onCambiar).toHaveBeenLastCalledWith("a");

    await userEvent.keyboard("{ArrowLeft}");
    expect(onCambiar).toHaveBeenLastCalledWith("c");

    await userEvent.keyboard("{Home}");
    expect(onCambiar).toHaveBeenLastCalledWith("a");
  });
});
