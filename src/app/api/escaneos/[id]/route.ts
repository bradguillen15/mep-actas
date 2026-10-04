import { NextRequest, NextResponse } from "next/server";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";
import { derivarAmbitoConsulta } from "@/server/auth/ambito";
import { crearServicioEscaneosDesdeDb } from "@/server/servicios/escaneos.fabrica";
import {
  responderErrorDeRecurso,
  respuestaNoAutorizada,
} from "@/server/http/respuestas";

type Parametros = { params: Promise<{ id: string }> };

const NO_ENCONTRADO = "Escaneo no encontrado";

export async function GET(_request: NextRequest, { params }: Parametros) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const ambito = derivarAmbitoConsulta(sesion);
  const servicio = crearServicioEscaneosDesdeDb(clienteDb());
  const escaneo = await servicio.obtenerEscaneoPorId(Number(id), ambito);

  if (!escaneo) {
    return NextResponse.json({ error: NO_ENCONTRADO }, { status: 404 });
  }

  const url = await servicio.generarUrlLectura(Number(id), ambito);
  return NextResponse.json({ ...escaneo, urlLectura: url });
}

export async function DELETE(_request: NextRequest, { params }: Parametros) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacionNivel = verificarRol(sesion, 3);
  if (!verificacionNivel.autorizado) {
    return respuestaNoAutorizada(verificacionNivel);
  }

  const { id } = await params;
  const servicio = crearServicioEscaneosDesdeDb(clienteDb());

  try {
    const escaneo = await servicio.eliminarEscaneo(Number(id), sesion);
    if (!escaneo) {
      return NextResponse.json({ error: NO_ENCONTRADO }, { status: 404 });
    }
    return NextResponse.json(escaneo);
  } catch (error) {
    return responderErrorDeRecurso(error, NO_ENCONTRADO);
  }
}
