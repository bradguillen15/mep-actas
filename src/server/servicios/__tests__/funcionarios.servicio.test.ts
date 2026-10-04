import { describe, it, expect, vi } from "vitest";
import { crearServicioFuncionarios } from "../funcionarios.servicio";

const ambito = { tipo: "region" as const, regionId: 1 };
const adminRegional = {
  usuarioId: 2, email: "r@mep.go.cr", rolId: 2, nivel: 2 as const, funcionarioId: 2, regionId: 1,
};

function crearDobles() {
  const repositorio = {
    listarFuncionarios: vi.fn().mockResolvedValue([]),
    obtenerFuncionarioPorId: vi.fn().mockResolvedValue(undefined),
    crearFuncionario: vi.fn(),
    actualizarFuncionario: vi.fn(),
    asignarFuncionarioAEscuela: vi.fn(),
    removerFuncionarioDeEscuela: vi.fn(),
    listarEscuelasDeFuncionario: vi.fn(),
  };
  const auditor = vi.fn();
  return { repositorio, auditor, servicio: crearServicioFuncionarios(repositorio, auditor) };
}

describe("funcionarios con ámbito", () => {
  it("propaga el ámbito al listar y al obtener", async () => {
    const { repositorio, servicio } = crearDobles();
    await servicio.listarFuncionarios({ escuelaId: 10 }, ambito);
    await servicio.obtenerFuncionarioPorId(4, ambito);
    expect(repositorio.listarFuncionarios).toHaveBeenCalledWith({ escuelaId: 10 }, ambito);
    expect(repositorio.obtenerFuncionarioPorId).toHaveBeenCalledWith(4, ambito);
  });

  it("actualizar un funcionario fuera del ámbito lanza NotFoundError sin escribir ni auditar", async () => {
    const { repositorio, auditor, servicio } = crearDobles();
    await expect(
      servicio.actualizarFuncionario(4, { puesto: "Director" }, adminRegional)
    ).rejects.toMatchObject({ name: "NotFoundError" });
    expect(repositorio.obtenerFuncionarioPorId).toHaveBeenCalledWith(4, ambito);
    expect(repositorio.actualizarFuncionario).not.toHaveBeenCalled();
    expect(auditor).not.toHaveBeenCalled();
  });
});
