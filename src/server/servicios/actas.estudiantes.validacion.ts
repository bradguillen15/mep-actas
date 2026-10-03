import { ErrorValidacion } from "@/server/errores";

export type EstudianteNuevo = {
  identificacion: string;
  nombres: string;
  apellidos: string;
  numeroCertificado: number;
};

export function etiquetaEstudiante(
  indice: number,
  identificacion: string
): string {
  return `Estudiante ${indice + 1} (cédula ${identificacion})`;
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

export function normalizarEstudiantes(entrada: unknown): EstudianteNuevo[] {
  if (!Array.isArray(entrada) || entrada.length === 0) {
    throw new ErrorValidacion("Debe indicar al menos un estudiante");
  }

  const estudiantes = entrada.map((crudo, indice): EstudianteNuevo => {
    const fila = (crudo ?? {}) as Record<string, unknown>;
    const identificacion = texto(fila.identificacion);
    if (!identificacion) {
      throw new ErrorValidacion(
        `Estudiante ${indice + 1}: la identificación es obligatoria`
      );
    }
    const numeroCertificado = fila.numeroCertificado;
    if (
      typeof numeroCertificado !== "number" ||
      !Number.isInteger(numeroCertificado) ||
      numeroCertificado <= 0
    ) {
      throw new ErrorValidacion(
        `${etiquetaEstudiante(indice, identificacion)}: el número de certificado debe ser un entero positivo`
      );
    }
    return {
      identificacion,
      nombres: texto(fila.nombres),
      apellidos: texto(fila.apellidos),
      numeroCertificado,
    };
  });

  const identificaciones = new Map<string, number>();
  const certificados = new Map<number, number>();
  estudiantes.forEach((estudiante, indice) => {
    const etiqueta = etiquetaEstudiante(indice, estudiante.identificacion);
    const previaIdentificacion = identificaciones.get(estudiante.identificacion);
    if (previaIdentificacion !== undefined) {
      throw new ErrorValidacion(
        `${etiqueta}: la identificación está repetida (también en el estudiante ${previaIdentificacion + 1})`
      );
    }
    const previoCertificado = certificados.get(estudiante.numeroCertificado);
    if (previoCertificado !== undefined) {
      throw new ErrorValidacion(
        `${etiqueta}: el número de certificado ${estudiante.numeroCertificado} está repetido (también en el estudiante ${previoCertificado + 1})`
      );
    }
    identificaciones.set(estudiante.identificacion, indice);
    certificados.set(estudiante.numeroCertificado, indice);
  });

  return estudiantes;
}
