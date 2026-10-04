import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  crearServicioActas,
  type OperacionesTransaccionales,
} from "../actas.servicio";
import type { SesionUsuario } from "@/server/auth/tipos";
import type { FilaActa } from "@/server/repositorios/actas.repositorio";

const acta: FilaActa = {
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

const datosActa = {
  escuelaId: 5,
  tipoActaId: 1,
  titulo: "Acta",
  numeroTomo: 1,
  folioInicio: 1,
  folioFin: 2,
  fecha: "2026-01-01",
};

const staffEscuela5: SesionUsuario = {
  usuarioId: 4,
  email: "staff@mep.go.cr",
  rolId: 4,
  nivel: 4,
  funcionarioId: 4,
  escuelaId: 5,
};

const estudianteA = {
  identificacion: "1-1111-1111",
  nombres: "Ana",
  apellidos: "Mora",
  numeroCertificado: 10,
};
const estudianteB = {
  identificacion: "2-2222-2222",
  nombres: "Beto",
  apellidos: "Soto",
  numeroCertificado: 11,
};

function crearDobles() {
  const ops = {
    obtenerActaPorId: vi.fn().mockResolvedValue(acta),
    crearActa: vi.fn().mockResolvedValue(acta),
    listarEstudiantesDeActa: vi.fn().mockResolvedValue([]),
    obtenerPersonaPorIdentificacion: vi.fn().mockResolvedValue(undefined),
    crearPersona: vi
      .fn()
      .mockImplementation(async (datos) => ({ id: 100, ...datos })),
    agregarEstudianteAActa: vi
      .fn()
      .mockImplementation(async (actaId, personaId, numeroCertificado) => ({
        id: 900 + personaId,
        actaId,
        estudianteId: personaId,
        numeroCertificado,
      })),
    auditor: vi.fn().mockResolvedValue(undefined),
  } satisfies OperacionesTransaccionales;
  const transaccion = vi.fn(async (trabajo) => trabajo(ops));
  const servicio = crearServicioActas(
    {
      listarActas: vi.fn(),
      obtenerActaPorId: vi.fn(),
      crearActa: vi.fn(),
      actualizarActa: vi.fn(),
    },
    {
      listarEstudiantesDeActa: vi.fn(),
      agregarEstudianteAActa: vi.fn(),
      listarFirmantesDeActa: vi.fn(),
      agregarFirmante: vi.fn(),
    },
    vi.fn(),
    transaccion
  );
  return { ops, transaccion, servicio };
}

describe("crearActaConEstudiantes", () => {
  let dobles: ReturnType<typeof crearDobles>;
  beforeEach(() => {
    dobles = crearDobles();
  });

  it("crea el acta, las personas faltantes y los vínculos dentro de una transacción", async () => {
    const resultado = await dobles.servicio.crearActaConEstudiantes(
      datosActa,
      [estudianteA, estudianteB],
      staffEscuela5
    );

    expect(dobles.transaccion).toHaveBeenCalledTimes(1);
    expect(dobles.ops.crearActa).toHaveBeenCalledWith(datosActa);
    expect(dobles.ops.crearPersona).toHaveBeenCalledTimes(2);
    expect(dobles.ops.agregarEstudianteAActa).toHaveBeenCalledTimes(2);
    expect(resultado.id).toBe(1);
    expect(resultado.estudiantes).toHaveLength(2);
  });

  it("reutiliza la persona existente sin crearla de nuevo", async () => {
    dobles.ops.obtenerPersonaPorIdentificacion.mockResolvedValue({
      id: 77,
      identificacion: estudianteA.identificacion,
    });

    await dobles.servicio.crearActaConEstudiantes(
      datosActa,
      [estudianteA],
      staffEscuela5
    );

    expect(dobles.ops.crearPersona).not.toHaveBeenCalled();
    expect(dobles.ops.agregarEstudianteAActa).toHaveBeenCalledWith(1, 77, 10);
  });

  it("audita el acta, las personas nuevas y los estudiantes agregados", async () => {
    await dobles.servicio.crearActaConEstudiantes(
      datosActa,
      [estudianteA],
      staffEscuela5
    );

    const registros = dobles.ops.auditor.mock.calls.map(
      ([parametros]) => `${parametros.tabla}:${parametros.accion}`
    );
    expect(registros).toEqual([
      "actas:crear",
      "personas:crear",
      "acta_estudiantes:agregar_estudiante",
    ]);
    expect(dobles.ops.auditor.mock.calls[2][0]).toMatchObject({
      usuarioId: 4,
      escuelaId: 5,
    });
  });

  it("rechaza identificaciones repetidas sin escribir nada", async () => {
    await expect(
      dobles.servicio.crearActaConEstudiantes(
        datosActa,
        [estudianteA, { ...estudianteB, identificacion: estudianteA.identificacion }],
        staffEscuela5
      )
    ).rejects.toMatchObject({
      name: "ValidationError",
      message: expect.stringContaining("Estudiante 2 (cédula 1-1111-1111)"),
    });
    expect(dobles.transaccion).not.toHaveBeenCalled();
  });

  it("rechaza números de certificado repetidos sin escribir nada", async () => {
    await expect(
      dobles.servicio.crearActaConEstudiantes(
        datosActa,
        [estudianteA, { ...estudianteB, numeroCertificado: 10 }],
        staffEscuela5
      )
    ).rejects.toMatchObject({
      name: "ValidationError",
      message: expect.stringContaining("Estudiante 2 (cédula 2-2222-2222)"),
    });
    expect(dobles.transaccion).not.toHaveBeenCalled();
  });

  it("rechaza un número de certificado inválido indicando el estudiante", async () => {
    await expect(
      dobles.servicio.crearActaConEstudiantes(
        datosActa,
        [{ ...estudianteA, numeroCertificado: Number.NaN }],
        staffEscuela5
      )
    ).rejects.toMatchObject({
      name: "ValidationError",
      message: expect.stringContaining("número de certificado"),
    });
  });

  it("identifica al estudiante cuyo registro falla y propaga el error para revertir", async () => {
    dobles.ops.agregarEstudianteAActa
      .mockResolvedValueOnce({ id: 1, actaId: 1, estudianteId: 1, numeroCertificado: 10 })
      .mockRejectedValueOnce(new Error("SQLITE_BUSY"));

    await expect(
      dobles.servicio.crearActaConEstudiantes(
        datosActa,
        [estudianteA, estudianteB],
        staffEscuela5
      )
    ).rejects.toMatchObject({
      name: "PersistenceError",
      message: expect.stringContaining("Estudiante 2 (cédula 2-2222-2222)"),
    });
  });

  it("exige nombres y apellidos cuando la persona no existe", async () => {
    await expect(
      dobles.servicio.crearActaConEstudiantes(
        datosActa,
        [{ ...estudianteA, nombres: " " }],
        staffEscuela5
      )
    ).rejects.toMatchObject({
      name: "ValidationError",
      message: expect.stringContaining("Estudiante 1 (cédula 1-1111-1111)"),
    });
  });
});

describe("agregarEstudiantes", () => {
  let dobles: ReturnType<typeof crearDobles>;
  beforeEach(() => {
    dobles = crearDobles();
  });

  it("agrega varios estudiantes en una sola transacción", async () => {
    const resultado = await dobles.servicio.agregarEstudiantes(
      1,
      [estudianteA, estudianteB],
      staffEscuela5
    );

    expect(dobles.transaccion).toHaveBeenCalledTimes(1);
    expect(resultado).toHaveLength(2);
  });

  it("respeta el ámbito: un acta fuera del ámbito responde NotFoundError", async () => {
    dobles.ops.obtenerActaPorId.mockResolvedValue(undefined);

    await expect(
      dobles.servicio.agregarEstudiantes(1, [estudianteA], staffEscuela5)
    ).rejects.toMatchObject({ name: "NotFoundError" });
    expect(dobles.ops.obtenerActaPorId).toHaveBeenCalledWith(1, {
      tipo: "escuela",
      escuelaId: 5,
    });
    expect(dobles.ops.agregarEstudianteAActa).not.toHaveBeenCalled();
  });

  it("rechaza un certificado ya usado en el acta antes de escribir", async () => {
    dobles.ops.listarEstudiantesDeActa.mockResolvedValue([
      {
        id: 1,
        actaId: 1,
        estudianteId: 9,
        numeroCertificado: 11,
        identificacion: "9-9999-9999",
        nombres: "X",
        apellidos: "Y",
      },
    ]);

    await expect(
      dobles.servicio.agregarEstudiantes(
        1,
        [estudianteA, estudianteB],
        staffEscuela5
      )
    ).rejects.toMatchObject({
      name: "ValidationError",
      message: expect.stringContaining("Estudiante 2 (cédula 2-2222-2222)"),
    });
    expect(dobles.ops.agregarEstudianteAActa).not.toHaveBeenCalled();
  });

  it("rechaza una persona que ya figura en el acta", async () => {
    dobles.ops.listarEstudiantesDeActa.mockResolvedValue([
      {
        id: 1,
        actaId: 1,
        estudianteId: 9,
        numeroCertificado: 99,
        identificacion: estudianteA.identificacion,
        nombres: "Ana",
        apellidos: "Mora",
      },
    ]);

    await expect(
      dobles.servicio.agregarEstudiantes(1, [estudianteA], staffEscuela5)
    ).rejects.toMatchObject({ name: "ValidationError" });
  });

  it("rechaza una lista vacía", async () => {
    await expect(
      dobles.servicio.agregarEstudiantes(1, [], staffEscuela5)
    ).rejects.toMatchObject({ name: "ValidationError" });
  });
});
