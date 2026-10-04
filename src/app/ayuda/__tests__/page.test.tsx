// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { NivelRol } from "@/server/auth/tipos";

const { obtenerSesionMock, redirectMock } = vi.hoisted(() => ({
  obtenerSesionMock: vi.fn(),
  redirectMock: vi.fn((destino: string): never => {
    throw new Error(`REDIRECT:${destino}`);
  }),
}));

vi.mock("@/server/auth/sesion.servicio", () => ({
  obtenerSesion: obtenerSesionMock,
}));

vi.mock("next/navigation", () => ({ redirect: redirectMock }));

vi.mock("@/contenido/ayuda/temas", () => ({
  temasAyuda: [
    {
      slug: "general",
      titulo: "Tema general",
      descripcion: "Para todos",
      niveles: [1, 2, 3, 4],
      orden: 1,
      palabrasClave: [],
    },
    {
      slug: "solo-pais",
      titulo: "Tema solo país",
      descripcion: "Solo nivel 1",
      niveles: [1],
      orden: 2,
      palabrasClave: [],
    },
  ],
}));

import PaginaAyuda from "../page";

function sesionConNivel(nivel: NivelRol) {
  return { usuarioId: 1, email: "a@mep.go.cr", rolId: nivel, nivel, funcionarioId: 1 };
}

beforeEach(() => {
  obtenerSesionMock.mockReset();
  redirectMock.mockClear();
});

describe("página /ayuda", () => {
  it("redirige al inicio de sesión si no hay sesión", async () => {
    obtenerSesionMock.mockResolvedValue(null);

    await expect(PaginaAyuda()).rejects.toThrow("REDIRECT:/iniciar-sesion");
  });

  it("muestra todos los temas al nivel 1", async () => {
    obtenerSesionMock.mockResolvedValue(sesionConNivel(1));

    render(await PaginaAyuda());

    expect(screen.getByRole("link", { name: /Tema general/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Tema solo país/ })).toBeInTheDocument();
  });

  it("no muestra al nivel 4 un tema exclusivo del nivel 1", async () => {
    obtenerSesionMock.mockResolvedValue(sesionConNivel(4));

    render(await PaginaAyuda());

    expect(screen.getByRole("link", { name: /Tema general/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Tema solo país/ })).not.toBeInTheDocument();
  });
});
