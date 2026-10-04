/* eslint-disable security/detect-non-literal-fs-filename -- directorio temporal de la prueba */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import sharp from "sharp";
import { crearGeneradorImagenesEscaneo, renderizarImagenFolio } from "../imagenes";

const DATOS = {
  clave: "escaneos/5/12/3.png",
  numeroTomo: 12,
  numeroFolio: 3,
  nombreEscuela: "Escuela Central & Hijos <1>",
};

let directorioBase: string;

beforeEach(() => {
  directorioBase = fs.mkdtempSync(path.join(os.tmpdir(), "semilla-imagenes-"));
});

afterEach(() => {
  fs.rmSync(directorioBase, { recursive: true, force: true });
});

describe("renderizarImagenFolio", () => {
  it("produce un PNG de 800x1100 aunque el nombre tenga caracteres especiales", async () => {
    const png = await renderizarImagenFolio(DATOS);
    const metadatos = await sharp(png).metadata();

    expect(metadatos.format).toBe("png");
    expect(metadatos.width).toBe(800);
    expect(metadatos.height).toBe(1100);
  });
});

describe("crearGeneradorImagenesEscaneo", () => {
  it("escribe la imagen en la clave indicada y informa que la generó", async () => {
    const generar = crearGeneradorImagenesEscaneo(directorioBase);

    expect(await generar(DATOS)).toBe(true);
    expect(fs.statSync(path.join(directorioBase, DATOS.clave)).size).toBeGreaterThan(0);
  });

  it("no regenera un archivo que ya existe", async () => {
    const generar = crearGeneradorImagenesEscaneo(directorioBase);
    await generar(DATOS);
    const ruta = path.join(directorioBase, DATOS.clave);
    fs.writeFileSync(ruta, "contenido propio");

    expect(await generar(DATOS)).toBe(false);
    expect(fs.readFileSync(ruta, "utf8")).toBe("contenido propio");
  });
});
