import { NextResponse } from "next/server";
import type { VerificacionRechazada } from "@/server/auth/tipos";

export function respuestaNoAutorizada(
  verificacion: VerificacionRechazada
): NextResponse {
  return NextResponse.json(
    { error: verificacion.mensaje },
    { status: verificacion.estado }
  );
}

export function responderErrorDeRecurso(
  error: unknown,
  mensajeNoEncontrado: string
): NextResponse {
  if (error instanceof Error && error.name === "NotFoundError") {
    return NextResponse.json({ error: mensajeNoEncontrado }, { status: 404 });
  }
  if (error instanceof Error && error.name === "ForbiddenError") {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  throw error;
}
