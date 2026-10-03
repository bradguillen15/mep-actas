import { NextRequest, NextResponse } from "next/server";
import { crearServicioPersonasDesdeDb } from "@/server/servicios/personas.fabrica";
import { derivarAmbitoConsulta } from "@/server/auth/ambito";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";
import { respuestaNoAutorizada } from "@/server/http/respuestas";

export async function GET(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const identificacion = searchParams.get("identificacion");
  const busqueda = searchParams.get("busqueda") ?? undefined;
  const servicio = crearServicioPersonasDesdeDb(clienteDb());

  if (identificacion) {
    const coincidencias =
      await servicio.buscarPersonaPorIdentificacionExacta(identificacion);
    return NextResponse.json(coincidencias);
  }

  const personas = await servicio.listarPersonas(
    busqueda,
    derivarAmbitoConsulta(sesion)
  );

  return NextResponse.json(personas);
}

export async function POST(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, 4);
  if (!verificacion.autorizado) {
    return respuestaNoAutorizada(verificacion);
  }

  const cuerpo = await request.json();
  const servicio = crearServicioPersonasDesdeDb(clienteDb());

  try {
    const persona = await servicio.crearPersona(cuerpo, sesion);
    return NextResponse.json(persona, { status: 201 });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "Error al crear persona";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
