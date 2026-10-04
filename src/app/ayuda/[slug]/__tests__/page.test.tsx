// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { NivelRol } from "@/server/auth/tipos";

const { obtenerSesionMock, redirectMock, notFoundMock, cargarContenidoMock } = vi.hoisted(() => ({
  obtenerSesionMock: vi.fn(),
  redirectMock: vi.fn((destino: string): never => {
    throw new Error(`REDIRECT:${destino}`);
  }),
  notFoundMock: vi.fn((): never => {
    throw new Error("NOT_FOUND");
  }),
  cargarContenidoMock: vi.fn(),
}));

vi.mock("@/server/auth/sesion.servicio", () => ({
  obtenerSesion: obtenerSesionMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  notFound: notFoundMock,
}));

vi.mock("@/contenido/ayuda/contenido", () => ({
  cargarContenidoTema: cargarContenidoMock,
}));

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

import PaginaTemaAyuda from "../page";

function sesionConNivel(nivel: NivelRol) {
  return { usuarioId: 1, email: "a@mep.go.cr", rolId: nivel, nivel, funcionarioId: 1 };
}

function parametros(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

beforeEach(() => {
  obtenerSesionMock.mockReset();
  redirectMock.mockClear();
  notFoundMock.mockClear();
  cargarContenidoMock.mockReset();
  cargarContenidoMock.mockResolvedValue(() => <p>Contenido del tema</p>);
});

describe("página /ayuda/[slug]", () => {
  it("redirige al inicio de sesión si no hay sesión", async () => {
    obtenerSesionMock.mockResolvedValue(null);

    await expect(PaginaTemaAyuda(parametros("general"))).rejects.toThrow(
      "REDIRECT:/iniciar-sesion"
    );
  });

  it("renderiza contenido y enlace de regreso para un tema permitido", async () => {
    obtenerSesionMock.mockResolvedValue(sesionConNivel(4));

    render(await PaginaTemaAyuda(parametros("general")));

    expect(screen.queryByRole("heading", { name: "Tema general" })).not.toBeInTheDocument();
    expect(screen.getByText("Contenido del tema")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Volver a Ayuda/ })).toHaveAttribute("href", "/ayuda");
  });

  it("responde notFound si el tema no está permitido para el nivel", async () => {
    obtenerSesionMock.mockResolvedValue(sesionConNivel(4));

    await expect(PaginaTemaAyuda(parametros("solo-pais"))).rejects.toThrow("NOT_FOUND");
    expect(cargarContenidoMock).not.toHaveBeenCalled();
  });

  it("responde notFound si el slug no existe en el catálogo", async () => {
    obtenerSesionMock.mockResolvedValue(sesionConNivel(1));

    await expect(PaginaTemaAyuda(parametros("inexistente"))).rejects.toThrow("NOT_FOUND");
  });

  it("responde notFound si el tema no tiene contenido cargable", async () => {
    obtenerSesionMock.mockResolvedValue(sesionConNivel(1));
    cargarContenidoMock.mockResolvedValue(null);

    await expect(PaginaTemaAyuda(parametros("general"))).rejects.toThrow("NOT_FOUND");
  });
});
