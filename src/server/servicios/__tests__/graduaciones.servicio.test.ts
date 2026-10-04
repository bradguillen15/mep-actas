import { describe, it, expect, vi } from "vitest";
import { crearServicioGraduaciones } from "../graduaciones.servicio";
import type { AmbitoConsulta } from "@/server/auth/ambito";

const ambito: AmbitoConsulta = { tipo: "escuela", escuelaId: 5 };

function crearServicio() {
  const repositorio = {
    buscarGraduaciones: vi
      .fn()
      .mockResolvedValue({ datos: [], total: 0, pagina: 1, limite: 20 }),
    obtenerGraduacionPorId: vi.fn().mockResolvedValue([]),
  };
  return { repositorio, servicio: crearServicioGraduaciones(repositorio) };
}

describe("servicio de graduaciones con ámbito", () => {
  it("propaga el ámbito a la búsqueda", async () => {
    const { repositorio, servicio } = crearServicio();
    await servicio.buscar({ nombre: "Ana" }, ambito);
    expect(repositorio.buscarGraduaciones).toHaveBeenCalledWith({ nombre: "Ana" }, ambito);
  });

  it("propaga el ámbito al obtener por id y responde NotFoundError si no hay filas", async () => {
    const { repositorio, servicio } = crearServicio();
    await expect(servicio.obtenerPorId(7, ambito)).rejects.toMatchObject({
      name: "NotFoundError",
    });
    expect(repositorio.obtenerGraduacionPorId).toHaveBeenCalledWith(7, ambito);
  });
});
