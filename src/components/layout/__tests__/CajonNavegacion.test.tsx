// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CajonNavegacion } from "../CajonNavegacion";

vi.mock("next/navigation", () => ({ usePathname: () => "/consultar" }));

vi.mock("@/hooks/useSesion", () => ({
  useSesion: () => ({
    usuario: { usuarioId: 1, email: "ana@mep.go.cr", nombre: "Ana Rojas", nivel: 1 },
    cerrarSesion: vi.fn(),
  }),
}));

describe("CajonNavegacion", () => {
  it("cerrado: el panel es inerte y no bloquea el scroll", () => {
    render(<CajonNavegacion abierto={false} onCerrar={vi.fn()} />);

    expect(document.getElementById("cajon-navegacion")).toHaveAttribute("inert");
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("abierto: es un diálogo modal, bloquea el scroll y enfoca el botón de cierre", () => {
    render(<CajonNavegacion abierto={true} onCerrar={vi.fn()} />);

    const panel = document.getElementById("cajon-navegacion");
    expect(panel).not.toHaveAttribute("inert");
    expect(panel).toHaveAttribute("role", "dialog");
    expect(panel).toHaveAttribute("aria-modal", "true");
    expect(panel).toHaveAttribute("aria-label", "Menú de navegación");
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByRole("button", { name: "Cerrar menú" })).toHaveFocus();
  });

  it("cierra con Escape", async () => {
    const onCerrar = vi.fn();
    render(<CajonNavegacion abierto={true} onCerrar={onCerrar} />);

    await userEvent.keyboard("{Escape}");
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it("cierra al hacer clic en el fondo", async () => {
    const onCerrar = vi.fn();
    render(<CajonNavegacion abierto={true} onCerrar={onCerrar} />);

    await userEvent.click(screen.getByTestId("fondo-cajon"));
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it("cierra al navegar con un enlace", async () => {
    const onCerrar = vi.fn();
    render(<CajonNavegacion abierto={true} onCerrar={onCerrar} />);

    await userEvent.click(screen.getByRole("link", { name: "Actas" }));
    expect(onCerrar).toHaveBeenCalled();
  });

  it("al cerrar devuelve el foco al elemento que lo tenía", () => {
    const disparador = document.createElement("button");
    document.body.appendChild(disparador);
    disparador.focus();

    const { rerender } = render(<CajonNavegacion abierto={true} onCerrar={vi.fn()} />);
    expect(disparador).not.toHaveFocus();

    rerender(<CajonNavegacion abierto={false} onCerrar={vi.fn()} />);
    expect(disparador).toHaveFocus();
    expect(document.body.style.overflow).not.toBe("hidden");
    disparador.remove();
  });

  it("Tab desde el último elemento enfocable vuelve al primero", async () => {
    render(<CajonNavegacion abierto={true} onCerrar={vi.fn()} />);

    const panel = document.getElementById("cajon-navegacion")!;
    const enfocables = panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];

    ultimo.focus();
    await userEvent.tab();
    expect(primero).toHaveFocus();
  });

  it("Shift+Tab desde el primer elemento enfocable va al último", async () => {
    render(<CajonNavegacion abierto={true} onCerrar={vi.fn()} />);

    const panel = document.getElementById("cajon-navegacion")!;
    const enfocables = panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];

    primero.focus();
    await userEvent.tab({ shift: true });
    expect(ultimo).toHaveFocus();
  });

  it("si el foco está fuera del panel, Tab lo devuelve al panel", async () => {
    const externo = document.createElement("button");
    document.body.appendChild(externo);
    render(<CajonNavegacion abierto={true} onCerrar={vi.fn()} />);

    externo.focus();
    await userEvent.tab();
    expect(document.getElementById("cajon-navegacion")).toContainElement(document.activeElement as HTMLElement);
    externo.remove();
  });
});
