// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BuscadorAyuda } from "../BuscadorAyuda";
import type { TemaAyuda } from "@/lib/ayuda/temas";

const temas: TemaAyuda[] = [
  {
    slug: "iniciar-sesion",
    titulo: "Iniciar sesión",
    descripcion: "Cómo ingresar al sistema",
    niveles: [1, 2, 3, 4],
    orden: 1,
    palabrasClave: ["contraseña"],
  },
  {
    slug: "actas",
    titulo: "Registrar actas",
    descripcion: "Alta de actas de graduación",
    niveles: [1, 2, 3, 4],
    orden: 2,
    palabrasClave: [],
  },
];

describe("BuscadorAyuda", () => {
  it("muestra un enlace por cada tema con título y descripción", () => {
    render(<BuscadorAyuda temas={temas} />);

    const enlace = screen.getByRole("link", { name: /Iniciar sesión/ });
    expect(enlace).toHaveAttribute("href", "/ayuda/iniciar-sesion");
    expect(screen.getByText("Cómo ingresar al sistema")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("tiene un campo de búsqueda con etiqueta accesible", () => {
    render(<BuscadorAyuda temas={temas} />);
    expect(screen.getByLabelText("Buscar en la ayuda")).toBeInTheDocument();
  });

  it("filtra los temas al escribir", async () => {
    render(<BuscadorAyuda temas={temas} />);

    await userEvent.type(screen.getByLabelText("Buscar en la ayuda"), "contrasena");

    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: /Iniciar sesión/ })).toBeInTheDocument();
  });

  it("muestra el estado vacío cuando nada coincide", async () => {
    render(<BuscadorAyuda temas={temas} />);

    await userEvent.type(screen.getByLabelText("Buscar en la ayuda"), "zzz");

    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.getByText("No se encontraron temas")).toBeInTheDocument();
  });

  it("muestra el estado vacío si no hay temas disponibles", () => {
    render(<BuscadorAyuda temas={[]} />);
    expect(screen.getByText("No se encontraron temas")).toBeInTheDocument();
  });
});
