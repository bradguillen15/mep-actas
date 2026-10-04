import type {
  EstudianteFormulario,
  ValoresFormularioActa,
} from "@/components/actas/tipos";

function prepararEstudiantes(estudiantes: EstudianteFormulario[]) {
  return estudiantes.map((estudiante) => ({
    identificacion: estudiante.identificacion,
    nombres: estudiante.nombres,
    apellidos: estudiante.apellidos,
    numeroCertificado: Number(estudiante.numeroCertificado),
  }));
}

async function enviarSolicitud<T>(
  url: string,
  cuerpo: unknown,
  mensajeError: string
): Promise<T> {
  const respuesta = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.json().catch(() => ({}));
    throw new Error(detalle.error ?? mensajeError);
  }
  return respuesta.json();
}

export async function crearActa(
  cuerpoActa: ReturnType<typeof construirCuerpoActa> & {
    actaReferenciaId?: number;
  }
): Promise<{ id: number }> {
  return enviarSolicitud("/api/actas", cuerpoActa, "Error al crear acta");
}

export async function agregarEstudiantesAlActa(
  actaId: number,
  estudiantes: EstudianteFormulario[]
): Promise<void> {
  if (estudiantes.length === 0) return;
  await enviarSolicitud(
    `/api/actas/${actaId}/estudiantes`,
    { estudiantes: prepararEstudiantes(estudiantes) },
    "Error al agregar estudiantes"
  );
}

export function construirCuerpoActa(
  datos: ValoresFormularioActa,
  escuelaId: number
) {
  return {
    escuelaId,
    tipoActaId: Number(datos.tipoActaId),
    titulo: datos.titulo,
    numeroTomo: Number(datos.numeroTomo),
    folioInicio: Number(datos.folioInicio),
    folioFin: Number(datos.folioFin),
    fecha: new Date(datos.fecha).toISOString(),
  };
}
