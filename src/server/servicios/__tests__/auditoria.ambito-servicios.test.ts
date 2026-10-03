import { describe, it, expect, vi } from "vitest";
import type { SesionUsuario } from "@/server/auth/tipos";
import { crearServicioActas } from "../actas.servicio";
import { crearServicioEscuelas } from "../escuelas.servicio";
import { crearServicioRegiones } from "../regiones.servicio";
import { crearServicioFuncionarios } from "../funcionarios.servicio";
import { crearServicioUsuarios } from "../usuarios.servicio";
import { crearServicioEscaneos } from "../escaneos.servicio";

const adminPais: SesionUsuario = { usuarioId: 1, email: "p@mep.go.cr", rolId: 1, nivel: 1, funcionarioId: 1 };

function ambitoAuditado(auditor: ReturnType<typeof vi.fn>) {
  const [params] = auditor.mock.calls.at(-1)!;
  return { escuelaId: params.escuelaId ?? null, regionId: params.regionId ?? null };
}

describe("cada servicio informa el ámbito del registro auditado", () => {
  const acta = { id: 1, escuelaId: 7, tipoActaId: 1, actaReferenciaId: null, titulo: "A", numeroTomo: 1, folioInicio: 1, folioFin: 2, fecha: "2026-01-01", createdAt: "" };

  function servicioActas(auditor: ReturnType<typeof vi.fn>) {
    return crearServicioActas(
      {
        listarActas: vi.fn(),
        obtenerActaPorId: vi.fn().mockResolvedValue(acta),
        crearActa: vi.fn().mockResolvedValue(acta),
        actualizarActa: vi.fn().mockResolvedValue(acta),
      },
      {
        listarEstudiantesDeActa: vi.fn(),
        agregarEstudianteAActa: vi.fn().mockResolvedValue({ id: 9 }),
        listarFirmantesDeActa: vi.fn(),
        agregarFirmante: vi.fn().mockResolvedValue({ id: 8 }),
      },
      auditor,
      vi.fn()
    );
  }

  it("actas: escuela del acta al crear, actualizar y agregar estudiantes o firmantes", async () => {
    const auditor = vi.fn();
    const servicio = servicioActas(auditor);
    await servicio.crearActa(
      { escuelaId: 7, tipoActaId: 1, titulo: "A", numeroTomo: 1, folioInicio: 1, folioFin: 2, fecha: "2026-01-01" },
      adminPais
    );
    expect(ambitoAuditado(auditor)).toEqual({ escuelaId: 7, regionId: null });
    await servicio.actualizarActa(1, { titulo: "B" }, adminPais);
    expect(ambitoAuditado(auditor).escuelaId).toBe(7);
    await servicio.agregarEstudiante(1, 3, 4, adminPais);
    expect(ambitoAuditado(auditor).escuelaId).toBe(7);
    await servicio.agregarFirmante(1, 3, "Director", adminPais);
    expect(ambitoAuditado(auditor).escuelaId).toBe(7);
  });

  it("escaneos: escuela del escaneo al subir y al eliminar", async () => {
    const auditor = vi.fn();
    const escaneo = { id: 5, escuelaId: 7, numeroTomo: 1, numeroFolio: 1, url: "k", formato: "jpg", uploadedBy: 1, createdAt: "" };
    const servicio = crearServicioEscaneos(
      {
        listarEscaneos: vi.fn(),
        obtenerEscaneoPorId: vi.fn().mockResolvedValue(escaneo),
        crearEscaneo: vi.fn().mockResolvedValue(escaneo),
        eliminarEscaneo: vi.fn().mockResolvedValue(escaneo),
      },
      auditor,
      {
        generarUrlSubida: async () => "https://r2.example/subida",
        generarUrlLectura: async () => "https://r2.example/lectura",
      }
    );
    await servicio.prepararSubida({ escuelaId: 7, numeroTomo: 1, numeroFolio: 1, formato: "jpg" }, adminPais);
    expect(ambitoAuditado(auditor).escuelaId).toBe(7);
    await servicio.eliminarEscaneo(5, adminPais);
    expect(ambitoAuditado(auditor).escuelaId).toBe(7);
  });

  it("escuelas: la escuela y su región", async () => {
    const auditor = vi.fn();
    const escuela = { id: 7, regionId: 2, codigoMep: "E7", nombre: "Escuela", activo: true };
    const servicio = crearServicioEscuelas(
      {
        listarEscuelas: vi.fn(),
        obtenerEscuelaPorId: vi.fn().mockResolvedValue(escuela),
        crearEscuela: vi.fn().mockResolvedValue(escuela),
        actualizarEscuela: vi.fn().mockResolvedValue(escuela),
        desactivarEscuela: vi.fn().mockResolvedValue(escuela),
        contarActasActivas: vi.fn().mockResolvedValue(0),
      },
      auditor
    );
    await servicio.crearEscuela({ regionId: 2, codigoMep: "E7", nombre: "Escuela" }, adminPais);
    expect(ambitoAuditado(auditor)).toEqual({ escuelaId: 7, regionId: 2 });
    await servicio.actualizarEscuela(7, { nombre: "Otra" }, adminPais);
    expect(ambitoAuditado(auditor)).toEqual({ escuelaId: 7, regionId: 2 });
    await servicio.desactivarEscuela(7, adminPais);
    expect(ambitoAuditado(auditor)).toEqual({ escuelaId: 7, regionId: 2 });
  });

  it("regiones: la región al actualizar y desactivar; la creación es nacional", async () => {
    const auditor = vi.fn();
    const region = { id: 2, nombre: "Región", activo: true };
    const servicio = crearServicioRegiones(
      {
        listarRegiones: vi.fn(),
        obtenerRegionPorId: vi.fn().mockResolvedValue(region),
        crearRegion: vi.fn().mockResolvedValue(region),
        actualizarRegion: vi.fn().mockResolvedValue(region),
        desactivarRegion: vi.fn().mockResolvedValue(region),
        contarEscuelasActivas: vi.fn().mockResolvedValue(0),
      },
      auditor
    );
    await servicio.crearRegion({ nombre: "Región" }, adminPais);
    expect(ambitoAuditado(auditor)).toEqual({ escuelaId: null, regionId: null });
    await servicio.actualizarRegion(2, { nombre: "Otra" }, adminPais);
    expect(ambitoAuditado(auditor)).toEqual({ escuelaId: null, regionId: 2 });
    await servicio.desactivarRegion(2, adminPais);
    expect(ambitoAuditado(auditor)).toEqual({ escuelaId: null, regionId: 2 });
  });

  it("funcionario_escuela: la escuela de la asignación", async () => {
    const auditor = vi.fn();
    const servicio = crearServicioFuncionarios(
      {
        listarFuncionarios: vi.fn(),
        obtenerFuncionarioPorId: vi.fn(),
        crearFuncionario: vi.fn(),
        actualizarFuncionario: vi.fn(),
        asignarFuncionarioAEscuela: vi.fn().mockResolvedValue({ id: 3 }),
        removerFuncionarioDeEscuela: vi.fn(),
        listarEscuelasDeFuncionario: vi.fn(),
      },
      auditor
    );
    await servicio.asignarFuncionarioAEscuela(4, 7, adminPais);
    expect(ambitoAuditado(auditor).escuelaId).toBe(7);
    await servicio.removerFuncionarioDeEscuela(4, 7, adminPais);
    expect(ambitoAuditado(auditor).escuelaId).toBe(7);
  });

  it("usuarios: la primera escuela del funcionario destino", async () => {
    const auditor = vi.fn();
    const destino = { id: 9, email: "d@e2e.test", activo: true, funcionarioId: 4, rolId: 4, nivel: 4, funcionarioNombres: "", funcionarioApellidos: "", funcionarioPuesto: "" };
    const servicio = crearServicioUsuarios(
      {
        listarUsuarios: vi.fn(),
        obtenerUsuarioPorId: vi.fn().mockResolvedValue(destino),
        obtenerUsuarioPorEmail: vi.fn().mockResolvedValue(undefined),
        crearUsuario: vi.fn().mockResolvedValue({ id: 9 }),
        actualizarPassword: vi.fn(),
        cambiarEstadoUsuario: vi.fn().mockResolvedValue(destino),
        obtenerNivelDeRol: vi.fn().mockResolvedValue(4),
        obtenerAmbitoDeFuncionario: vi.fn().mockResolvedValue({ escuelaIds: [7, 8], regionIds: [2] }),
      },
      auditor
    );
    await servicio.crear({ funcionarioId: 4, rolId: 4, email: "d@e2e.test", passwordHash: "h" }, adminPais);
    expect(ambitoAuditado(auditor).escuelaId).toBe(7);
    await servicio.cambiarEstado(9, false, adminPais);
    expect(ambitoAuditado(auditor).escuelaId).toBe(7);
    await servicio.actualizarPassword(9, "h", adminPais);
    expect(ambitoAuditado(auditor).escuelaId).toBe(7);
  });
});
