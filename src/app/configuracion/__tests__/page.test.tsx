// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Configuracion from "../page";

vi.mock("@/hooks/useSesion", () => ({
  useSesion: () => ({ usuario: { nivel: 1 } }),
}));

vi.mock("swr", () => ({
  default: () => ({ data: [], isLoading: false, mutate: vi.fn() }),
  mutate: vi.fn(),
}));

describe("Configuración — pestañas", () => {
  it("muestra Usuarios, Tipos de acta, Regiones y Escuelas sin Catálogos", () => {
    render(<Configuracion />);
    const nombres = screen.getAllByRole("button", { name: /^(Usuarios|Tipos de acta|Regiones|Escuelas|Catálogos)$/ }).map((b) => b.textContent);
    expect(nombres).toEqual(["Usuarios", "Tipos de acta", "Regiones", "Escuelas"]);
  });

  it("cambia de pestaña a Regiones y a Escuelas", async () => {
    render(<Configuracion />);
    await userEvent.click(screen.getByRole("button", { name: "Regiones" }));
    expect(screen.getByRole("button", { name: /nueva región/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Escuelas" }));
    expect(screen.getByRole("button", { name: /nueva escuela/i })).toBeInTheDocument();
  });
});
