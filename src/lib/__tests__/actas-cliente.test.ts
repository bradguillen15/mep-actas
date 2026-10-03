import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  agregarEstudiantesAlActa,
  crearActaConEstudiantes,
} from "../actas-cliente";

const estudiantesFormulario = [
  { identificacion: "1-1111-1111", nombres: "Ana", apellidos: "Mora", numeroCertificado: "10" },
  { identificacion: "2-2222-2222", nombres: "Beto", apellidos: "Soto", numeroCertificado: "11" },
];

const estudiantesEnviados = [
  { identificacion: "1-1111-1111", nombres: "Ana", apellidos: "Mora", numeroCertificado: 10 },
  { identificacion: "2-2222-2222", nombres: "Beto", apellidos: "Soto", numeroCertificado: 11 },
];

const cuerpoActa = {
  escuelaId: 5,
  tipoActaId: 1,
  titulo: "Acta",
  numeroTomo: 1,
  folioInicio: 1,
  folioFin: 2,
  fecha: "2026-01-01T00:00:00.000Z",
};

function respuesta(estado: number, cuerpo: unknown) {
  return new Response(JSON.stringify(cuerpo), { status: estado });
}

describe("actas-cliente", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  describe("crearActaConEstudiantes", () => {
    it("crea el acta con todos los estudiantes en una única solicitud", async () => {
      fetchMock.mockResolvedValue(respuesta(201, { id: 42 }));

      const acta = await crearActaConEstudiantes(cuerpoActa, estudiantesFormulario);

      expect(acta.id).toBe(42);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, opciones] = fetchMock.mock.calls[0];
      expect(url).toBe("/api/actas");
      expect(opciones.method).toBe("POST");
      expect(JSON.parse(opciones.body)).toEqual({
        ...cuerpoActa,
        estudiantes: estudiantesEnviados,
      });
    });

    it("propaga el mensaje de error de la API", async () => {
      fetchMock.mockResolvedValue(
        respuesta(400, { error: "Estudiante 2 (cédula 2-2222-2222): certificado repetido" })
      );

      await expect(
        crearActaConEstudiantes(cuerpoActa, estudiantesFormulario)
      ).rejects.toThrow("Estudiante 2 (cédula 2-2222-2222): certificado repetido");
    });

    it("usa un mensaje genérico si la respuesta no trae JSON", async () => {
      fetchMock.mockResolvedValue(new Response("falló", { status: 500 }));

      await expect(
        crearActaConEstudiantes(cuerpoActa, estudiantesFormulario)
      ).rejects.toThrow("Error al crear acta");
    });
  });

  describe("agregarEstudiantesAlActa", () => {
    it("envía todos los estudiantes en un solo lote", async () => {
      fetchMock.mockResolvedValue(respuesta(201, [{ id: 1 }, { id: 2 }]));

      await agregarEstudiantesAlActa(7, estudiantesFormulario);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, opciones] = fetchMock.mock.calls[0];
      expect(url).toBe("/api/actas/7/estudiantes");
      expect(JSON.parse(opciones.body)).toEqual({ estudiantes: estudiantesEnviados });
    });

    it("no hace solicitudes si no hay estudiantes nuevos", async () => {
      await agregarEstudiantesAlActa(7, []);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("propaga el mensaje de error de la API", async () => {
      fetchMock.mockResolvedValue(
        respuesta(400, { error: "Estudiante 1 (cédula 1-1111-1111): ya figura en el acta" })
      );

      await expect(
        agregarEstudiantesAlActa(7, estudiantesFormulario)
      ).rejects.toThrow("Estudiante 1 (cédula 1-1111-1111): ya figura en el acta");
    });
  });
});
