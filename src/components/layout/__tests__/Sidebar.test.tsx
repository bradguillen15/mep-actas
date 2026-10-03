// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "../Sidebar";

const { sesion } = vi.hoisted(() => ({ sesion: { nivel: 1 } }));

vi.mock("next/navigation", () => ({ usePathname: () => "/consultar" }));

vi.mock("@/hooks/useSesion", () => ({
  useSesion: () => ({
    usuario: { usuarioId: 1, nombre: "Ana Rojas", nivel: sesion.nivel },
    cerrarSesion: vi.fn(),
  }),
}));

describe("Sidebar", () => {
  it.each([1, 2, 3, 4])("muestra el enlace Ayuda para el nivel %i", (nivel) => {
    sesion.nivel = nivel;
    render(<Sidebar />);

    expect(screen.getByRole("link", { name: "Ayuda" })).toHaveAttribute("href", "/ayuda");
  });

  it.each([1, 2, 3, 4])("muestra el enlace Auditoría para el nivel %i", (nivel) => {
    sesion.nivel = nivel;
    render(<Sidebar />);

    expect(screen.getByRole("link", { name: "Auditoría" })).toHaveAttribute("href", "/auditoria");
  });

  it("oculta Usuarios al nivel 4 pero mantiene Ayuda", () => {
    sesion.nivel = 4;
    render(<Sidebar />);

    expect(screen.queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ayuda" })).toBeInTheDocument();
  });
});

describe("Sidebar (estado y marca)", () => {
  it("marca el enlace activo con aria-current=page y los demás no", () => {
    sesion.nivel = 1;
    render(<Sidebar />);

    expect(screen.getByRole("link", { name: "Consultar" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Actas" })).not.toHaveAttribute("aria-current");
  });

  it("el bloque de marca enlaza a /consultar", () => {
    render(<Sidebar />);

    expect(screen.getByRole("link", { name: /Sistema de Consulta de Títulos/ })).toHaveAttribute(
      "href",
      "/consultar"
    );
  });

  it("muestra iniciales, nombre y rol del usuario", () => {
    sesion.nivel = 2;
    render(<Sidebar />);

    expect(screen.getByText("AR")).toBeInTheDocument();
    expect(screen.getByText("Ana Rojas")).toHaveAttribute("title", "Ana Rojas");
    expect(screen.getByText("Admin Regional")).toBeInTheDocument();
  });
});
