import { describe, it, expect } from "vitest";
import type { SesionUsuario } from "../tipos";

describe("verificarRol", () => {
  const sesionAdminPais: SesionUsuario = {
    usuarioId: 1,
    email: "admin@pais.go.cr",
    rolId: 1,
    nivel: 1,
    funcionarioId: 1,
  };

  const sesionAdminRegional: SesionUsuario = {
    usuarioId: 2,
    email: "admin@region.go.cr",
    rolId: 2,
    nivel: 2,
    funcionarioId: 2,
    regionId: 5,
  };

  const sesionAdminEscuela: SesionUsuario = {
    usuarioId: 3,
    email: "admin@escuela.go.cr",
    rolId: 3,
    nivel: 3,
    funcionarioId: 3,
    escuelaId: 10,
  };

  const sesionStaff: SesionUsuario = {
    usuarioId: 4,
    email: "staff@escuela.go.cr",
    rolId: 4,
    nivel: 4,
    funcionarioId: 4,
    escuelaId: 10,
  };

  it("autoriza a Admin Pais para cualquier nivel minimo", async () => {
    const { verificarRol } = await import("../autorizacion.servicio");
    const resultado = verificarRol(sesionAdminPais, 4);
    expect(resultado.autorizado).toBe(true);
  });

  it("autoriza a Admin Pais para nivel 1", async () => {
    const { verificarRol } = await import("../autorizacion.servicio");
    const resultado = verificarRol(sesionAdminPais, 1);
    expect(resultado.autorizado).toBe(true);
  });

  it("rechaza a Staff para nivel 3", async () => {
    const { verificarRol } = await import("../autorizacion.servicio");
    const resultado = verificarRol(sesionStaff, 3);
    expect(resultado.autorizado).toBe(false);
    expect(resultado).toMatchObject({ estado: 403 });
  });

  it("responde 401 con mensaje legible cuando no hay sesión", async () => {
    const { verificarRol } = await import("../autorizacion.servicio");
    expect(verificarRol(null, 4)).toEqual({
      autorizado: false,
      estado: 401,
      mensaje: "No autorizado",
    });
  });

  it("responde 403 con mensaje de permisos cuando el nivel es insuficiente", async () => {
    const { verificarRol } = await import("../autorizacion.servicio");
    expect(verificarRol(sesionStaff, 3)).toEqual({
      autorizado: false,
      estado: 403,
      mensaje: "No tiene permisos para realizar esta acción",
    });
  });

  it("responde 403 con mensaje de alcance cuando la escuela es ajena", async () => {
    const { verificarRol } = await import("../autorizacion.servicio");
    expect(verificarRol(sesionStaff, 4, { escuelaId: 99 })).toEqual({
      autorizado: false,
      estado: 403,
      mensaje: "No tiene permisos sobre esta escuela o región",
    });
  });

  it("autoriza a Admin Regional para nivel 3", async () => {
    const { verificarRol } = await import("../autorizacion.servicio");
    const resultado = verificarRol(sesionAdminRegional, 3);
    expect(resultado.autorizado).toBe(true);
  });

  it("autoriza a Admin Escuela para nivel 3", async () => {
    const { verificarRol } = await import("../autorizacion.servicio");
    const resultado = verificarRol(sesionAdminEscuela, 3);
    expect(resultado.autorizado).toBe(true);
  });

  it("rechaza a Admin Escuela para nivel 1", async () => {
    const { verificarRol } = await import("../autorizacion.servicio");
    const resultado = verificarRol(sesionAdminEscuela, 1);
    expect(resultado.autorizado).toBe(false);
    expect(resultado).toMatchObject({ estado: 403 });
  });

  it("verifica ambito por escuela correctamente", async () => {
    const { verificarRol } = await import("../autorizacion.servicio");
    const resultado = verificarRol(sesionAdminEscuela, 3, { escuelaId: 10 });
    expect(resultado.autorizado).toBe(true);
  });

  it("rechaza ambito por escuela incorrecto", async () => {
    const { verificarRol } = await import("../autorizacion.servicio");
    const resultado = verificarRol(sesionAdminEscuela, 3, { escuelaId: 99 });
    expect(resultado.autorizado).toBe(false);
    expect(resultado).toMatchObject({ estado: 403 });
  });

  it("Admin Pais pasa cualquier ambito de escuela", async () => {
    const { verificarRol } = await import("../autorizacion.servicio");
    const resultado = verificarRol(sesionAdminPais, 3, { escuelaId: 999 });
    expect(resultado.autorizado).toBe(true);
  });

  it("verifica ambito por region correctamente", async () => {
    const { verificarRol } = await import("../autorizacion.servicio");
    const resultado = verificarRol(sesionAdminRegional, 2, { regionId: 5 });
    expect(resultado.autorizado).toBe(true);
  });

  it("rechaza ambito por region incorrecto", async () => {
    const { verificarRol } = await import("../autorizacion.servicio");
    const resultado = verificarRol(sesionAdminRegional, 2, { regionId: 99 });
    expect(resultado.autorizado).toBe(false);
    expect(resultado).toMatchObject({ estado: 403 });
  });

  describe("Admin Regional con escuela objetivo", () => {
    it("rechaza una escuela de otra región", async () => {
      const { verificarRol } = await import("../autorizacion.servicio");
      const resultado = verificarRol(sesionAdminRegional, 4, {
        escuelaId: 20,
        regionId: 6,
      });
      expect(resultado.autorizado).toBe(false);
      expect(resultado).toMatchObject({ estado: 403 });
    });

    it("autoriza una escuela de su región", async () => {
      const { verificarRol } = await import("../autorizacion.servicio");
      const resultado = verificarRol(sesionAdminRegional, 4, {
        escuelaId: 20,
        regionId: 5,
      });
      expect(resultado.autorizado).toBe(true);
    });

    it("falla cerrado si no se resolvió la región de la escuela", async () => {
      const { verificarRol } = await import("../autorizacion.servicio");
      const resultado = verificarRol(sesionAdminRegional, 4, { escuelaId: 20 });
      expect(resultado.autorizado).toBe(false);
      expect(resultado).toMatchObject({ estado: 403 });
    });
  });

  it("rechaza a Staff con una escuela distinta", async () => {
    const { verificarRol } = await import("../autorizacion.servicio");
    const resultado = verificarRol(sesionStaff, 4, {
      escuelaId: 11,
      regionId: 5,
    });
    expect(resultado.autorizado).toBe(false);
    expect(resultado).toMatchObject({ estado: 403 });
  });

  it("autoriza a Staff en su escuela aunque se informe la región", async () => {
    const { verificarRol } = await import("../autorizacion.servicio");
    const resultado = verificarRol(sesionStaff, 4, {
      escuelaId: 10,
      regionId: 5,
    });
    expect(resultado.autorizado).toBe(true);
  });
});
