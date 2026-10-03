import { describe, it, expect, vi } from "vitest";
import { crearServicioPersonas } from "../personas.servicio";

const personaMinima = {
  id: 1,
  identificacion: "101230002",
  nombres: "María",
  apellidos: "González Ruiz",
};

const staff = {
  usuarioId: 4, email: "s@mep.go.cr", rolId: 4, nivel: 4 as const, funcionarioId: 4, escuelaId: 5,
};

function crearDobles() {
  const repositorio = {
    listarPersonas: vi.fn().mockResolvedValue([]),
    obtenerPersonaPorId: vi.fn(),
    obtenerPersonaPorIdentificacion: vi.fn().mockResolvedValue(undefined),
    obtenerPersonaMinimaPorIdentificacion: vi.fn().mockResolvedValue(undefined),
    crearPersona: vi.fn().mockResolvedValue(personaMinima),
    actualizarPersona: vi.fn(),
  };
  const auditor = vi.fn();
  return { repositorio, auditor, servicio: crearServicioPersonas(repositorio, auditor) };
}

describe("buscarPersonaPorIdentificacionExacta", () => {
  it("devuelve una lista con la persona mínima si existe", async () => {
    const { repositorio, servicio } = crearDobles();
    repositorio.obtenerPersonaMinimaPorIdentificacion.mockResolvedValue(personaMinima);
    expect(await servicio.buscarPersonaPorIdentificacionExacta("101230002")).toEqual([
      personaMinima,
    ]);
  });

  it("devuelve una lista vacía si no existe", async () => {
    const { servicio } = crearDobles();
    expect(await servicio.buscarPersonaPorIdentificacionExacta("1")).toEqual([]);
  });
});

describe("crearPersona", () => {
  it("crea y audita la persona", async () => {
    const { repositorio, auditor, servicio } = crearDobles();
    await servicio.crearPersona(
      { identificacion: "101230002", nombres: "María", apellidos: "González Ruiz" },
      staff
    );
    expect(repositorio.crearPersona).toHaveBeenCalled();
    expect(auditor).toHaveBeenCalledWith(
      expect.objectContaining({ tabla: "personas", accion: "crear" })
    );
  });

  it("rechaza una identificación duplicada sin crear ni auditar", async () => {
    const { repositorio, auditor, servicio } = crearDobles();
    repositorio.obtenerPersonaPorIdentificacion.mockResolvedValue(personaMinima);
    await expect(
      servicio.crearPersona(
        { identificacion: "101230002", nombres: "María", apellidos: "González Ruiz" },
        staff
      )
    ).rejects.toMatchObject({ name: "ConflictError" });
    expect(repositorio.crearPersona).not.toHaveBeenCalled();
    expect(auditor).not.toHaveBeenCalled();
  });
});

describe("personas con ámbito", () => {
  const ambito = { tipo: "escuela" as const, escuelaId: 5 };

  it("propaga el ámbito al listar y al obtener", async () => {
    const { repositorio, servicio } = crearDobles();
    await servicio.listarPersonas("Mora", ambito);
    await servicio.obtenerPersonaPorId(3, ambito);
    expect(repositorio.listarPersonas).toHaveBeenCalledWith("Mora", ambito);
    expect(repositorio.obtenerPersonaPorId).toHaveBeenCalledWith(3, ambito);
  });

  it("actualizar una persona fuera del ámbito lanza NotFoundError sin escribir ni auditar", async () => {
    const { repositorio, auditor, servicio } = crearDobles();
    repositorio.obtenerPersonaPorId.mockResolvedValue(undefined);
    await expect(
      servicio.actualizarPersona(3, { identificacion: "101230002" }, staff)
    ).rejects.toMatchObject({ name: "NotFoundError" });
    expect(repositorio.obtenerPersonaPorId).toHaveBeenCalledWith(3, ambito);
    expect(repositorio.obtenerPersonaPorIdentificacion).not.toHaveBeenCalled();
    expect(repositorio.actualizarPersona).not.toHaveBeenCalled();
    expect(auditor).not.toHaveBeenCalled();
  });
});
