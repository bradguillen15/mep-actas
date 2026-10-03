import { describe, it, expect, vi, beforeEach } from "vitest";
import { crearServicioActas } from "../actas.servicio";
import type { SesionUsuario } from "@/server/auth/tipos";
import type { AmbitoConsulta } from "@/server/auth/ambito";
import type { FilaActa } from "@/server/repositorios/actas.repositorio";

const actaDeEscuela5: FilaActa = {
  id: 1,
  escuelaId: 5,
  tipoActaId: 1,
  actaReferenciaId: null,
  titulo: "Acta",
  numeroTomo: 1,
  folioInicio: 1,
  folioFin: 2,
  fecha: "2026-01-01",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const staffEscuela5: SesionUsuario = {
  usuarioId: 4,
  email: "staff@mep.go.cr",
  rolId: 4,
  nivel: 4,
  funcionarioId: 4,
  escuelaId: 5,
};

const ambitoEscuela5: AmbitoConsulta = { tipo: "escuela", escuelaId: 5 };

function crearDobles() {
  const repositorio = {
    listarActas: vi.fn().mockResolvedValue([actaDeEscuela5]),
    obtenerActaPorId: vi.fn().mockResolvedValue(actaDeEscuela5),
    crearActa: vi.fn().mockResolvedValue(actaDeEscuela5),
    actualizarActa: vi.fn().mockResolvedValue(actaDeEscuela5),
  };
  const detalle = {
    listarEstudiantesDeActa: vi.fn().mockResolvedValue([]),
    agregarEstudianteAActa: vi
      .fn()
      .mockResolvedValue({ id: 9, actaId: 1, estudianteId: 3, numeroCertificado: 7 }),
    listarFirmantesDeActa: vi.fn().mockResolvedValue([]),
    agregarFirmante: vi
      .fn()
      .mockResolvedValue({ id: 8, actaId: 1, funcionarioId: 2, rolFirma: "Director" }),
  };
  const auditor = vi.fn().mockResolvedValue(undefined);
  const servicio = crearServicioActas(repositorio, detalle, auditor, vi.fn());
  return { repositorio, detalle, auditor, servicio };
}

describe("servicio de actas con ámbito", () => {
  let dobles: ReturnType<typeof crearDobles>;

  beforeEach(() => {
    dobles = crearDobles();
  });

  it("propaga el ámbito al listar", async () => {
    await dobles.servicio.listarActas({ tomo: 1 }, ambitoEscuela5);
    expect(dobles.repositorio.listarActas).toHaveBeenCalledWith({ tomo: 1 }, ambitoEscuela5);
  });

  it("propaga el ámbito al obtener por id", async () => {
    await dobles.servicio.obtenerActaPorId(1, ambitoEscuela5);
    expect(dobles.repositorio.obtenerActaPorId).toHaveBeenCalledWith(1, ambitoEscuela5);
  });

  it("lanza NotFoundError si el acta está fuera del ámbito", async () => {
    dobles.repositorio.obtenerActaPorId.mockResolvedValue(undefined);
    await expect(dobles.servicio.obtenerActaPorId(1, ambitoEscuela5)).rejects.toMatchObject({
      name: "NotFoundError",
    });
  });

  describe("escrituras sobre un acta fuera del ámbito", () => {
    beforeEach(() => {
      dobles.repositorio.obtenerActaPorId.mockResolvedValue(undefined);
    });

    it("no agrega estudiante ni audita", async () => {
      await expect(
        dobles.servicio.agregarEstudiante(1, 3, 7, staffEscuela5)
      ).rejects.toMatchObject({ name: "NotFoundError" });
      expect(dobles.detalle.agregarEstudianteAActa).not.toHaveBeenCalled();
      expect(dobles.auditor).not.toHaveBeenCalled();
    });

    it("no agrega firmante ni audita", async () => {
      await expect(
        dobles.servicio.agregarFirmante(1, 2, "Director", staffEscuela5)
      ).rejects.toMatchObject({ name: "NotFoundError" });
      expect(dobles.detalle.agregarFirmante).not.toHaveBeenCalled();
      expect(dobles.auditor).not.toHaveBeenCalled();
    });

    it("no actualiza el acta ni audita", async () => {
      await expect(
        dobles.servicio.actualizarActa(1, { titulo: "Otro" }, staffEscuela5)
      ).rejects.toMatchObject({ name: "NotFoundError" });
      expect(dobles.repositorio.actualizarActa).not.toHaveBeenCalled();
      expect(dobles.auditor).not.toHaveBeenCalled();
    });

    it("no lista estudiantes ni firmantes", async () => {
      await expect(
        dobles.servicio.listarEstudiantesDeActa(1, ambitoEscuela5)
      ).rejects.toMatchObject({ name: "NotFoundError" });
      await expect(
        dobles.servicio.listarFirmantesDeActa(1, ambitoEscuela5)
      ).rejects.toMatchObject({ name: "NotFoundError" });
      expect(dobles.detalle.listarEstudiantesDeActa).not.toHaveBeenCalled();
      expect(dobles.detalle.listarFirmantesDeActa).not.toHaveBeenCalled();
    });
  });

  it("carga el acta con el ámbito de la sesión antes de agregar un estudiante", async () => {
    await dobles.servicio.agregarEstudiante(1, 3, 7, staffEscuela5);
    expect(dobles.repositorio.obtenerActaPorId).toHaveBeenCalledWith(1, ambitoEscuela5);
    expect(dobles.detalle.agregarEstudianteAActa).toHaveBeenCalledWith(1, 3, 7);
    expect(dobles.auditor).toHaveBeenCalledTimes(1);
  });
});
