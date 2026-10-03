// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Configuracion from "../page";

const { parametros, reemplazarMock } = vi.hoisted(() => ({
  parametros: { actual: "" },
  reemplazarMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(parametros.actual),
  useRouter: () => ({ replace: reemplazarMock }),
  usePathname: () => "/configuracion",
}));

vi.mock("@/hooks/useSesion", () => ({
  useSesion: () => ({ usuario: { nivel: 1 } }),
}));

vi.mock("swr", () => ({
  default: () => ({ data: [], isLoading: false, mutate: vi.fn() }),
  mutate: vi.fn(),
}));

beforeEach(() => {
  parametros.actual = "";
  reemplazarMock.mockReset();
});

describe("Configuración — pestañas", () => {
  it("muestra Tipos de acta, Regiones y Escuelas, sin Usuarios ni Catálogos", () => {
    render(<Configuracion />);
    const nombres = screen.getAllByRole("tab").map((b) => b.textContent);
    expect(nombres).toEqual(["Tipos de acta", "Regiones", "Escuelas"]);
  });

  it("abre por defecto la pestaña Tipos de acta", () => {
    render(<Configuracion />);
    expect(screen.getByRole("tab", { name: "Tipos de acta" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("button", { name: /nuevo tipo/i })).toBeInTheDocument();
  });

  it("abre la pestaña indicada en el parámetro tab de la URL", () => {
    parametros.actual = "tab=escuelas";
    render(<Configuracion />);
    expect(screen.getByRole("tab", { name: "Escuelas" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("button", { name: /nueva escuela/i })).toBeInTheDocument();
  });

  it("ignora un valor de tab desconocido", () => {
    parametros.actual = "tab=otra";
    render(<Configuracion />);
    expect(screen.getByRole("tab", { name: "Tipos de acta" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  it("al cambiar de pestaña actualiza la URL y muestra su contenido", async () => {
    render(<Configuracion />);
    await userEvent.click(screen.getByRole("tab", { name: "Regiones" }));
    expect(reemplazarMock).toHaveBeenCalledWith("/configuracion?tab=regiones", {
      scroll: false,
    });
  });
});
