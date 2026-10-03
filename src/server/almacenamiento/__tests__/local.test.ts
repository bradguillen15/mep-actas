import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import {
  crearAlmacenamientoLocal,
  escribirArchivoLocal,
  leerArchivoLocal,
  resolverRutaLocal,
} from "../local";

let directorioBase: string;

beforeEach(() => {
  directorioBase = fs.mkdtempSync(path.join(os.tmpdir(), "almacenamiento-local-"));
});

afterEach(() => {
  fs.rmSync(directorioBase, { recursive: true, force: true });
});

describe("resolverRutaLocal", () => {
  it("resuelve una clave válida dentro del directorio base", () => {
    expect(resolverRutaLocal(directorioBase, "escaneos/5/3/12.png")).toBe(
      path.join(directorioBase, "escaneos", "5", "3", "12.png")
    );
  });

  it.each([
    "../secreto.png",
    "escaneos/../../secreto.png",
    "/etc/passwd",
    "escaneos/5/3/12.exe",
    "escaneos/5/3/../12.png",
    "escaneos/a/3/12.png",
    "otra/5/3/12.png",
    "",
  ])("rechaza la clave %s", (clave) => {
    expect(() => resolverRutaLocal(directorioBase, clave)).toThrow(/clave/i);
  });
});

describe("archivos locales", () => {
  it("escribe y lee el mismo contenido con su tipo de contenido", async () => {
    const contenido = Buffer.from("contenido de prueba");
    await escribirArchivoLocal(directorioBase, "escaneos/5/3/12.png", contenido);

    const archivo = await leerArchivoLocal(directorioBase, "escaneos/5/3/12.png");

    expect(archivo?.contenido.equals(contenido)).toBe(true);
    expect(archivo?.tipoContenido).toBe("image/png");
  });

  it("devuelve undefined si el archivo no existe", async () => {
    expect(await leerArchivoLocal(directorioBase, "escaneos/5/3/99.pdf")).toBeUndefined();
  });

  it("no escribe fuera del directorio base", async () => {
    await expect(
      escribirArchivoLocal(directorioBase, "escaneos/../../fuera.png", Buffer.from("x"))
    ).rejects.toThrow(/clave/i);
  });
});

describe("crearAlmacenamientoLocal", () => {
  it("genera URLs del mismo origen para lectura y subida", async () => {
    const almacenamiento = crearAlmacenamientoLocal();
    expect(await almacenamiento.generarUrlLectura("escaneos/5/3/12.png")).toBe(
      "/api/almacenamiento-local/escaneos/5/3/12.png"
    );
    expect(
      await almacenamiento.generarUrlSubida("escaneos/5/3/12.png", "image/png")
    ).toBe("/api/almacenamiento-local/escaneos/5/3/12.png");
  });
});
