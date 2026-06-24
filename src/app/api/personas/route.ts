import { NextRequest, NextResponse } from "next/server";
import { crearAuditor } from "@/server/servicios/auditoria.servicio";
import { crearServicioPersonas } from "@/server/servicios/personas.servicio";
import * as repositorio from "@/server/repositorios/personas.repositorio";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";

async function crearServicio() {
  const db = clienteDb();
  const auditor = crearAuditor(db);
  return crearServicioPersonas(
    {
      listarPersonas: (busqueda) => repositorio.listarPersonas(db, busqueda),
      obtenerPersonaPorId: (id) => repositorio.obtenerPersonaPorId(db, id),
      obtenerPersonaPorIdentificacion: (identificacion) =>
        repositorio.obtenerPersonaPorIdentificacion(db, identificacion),
      crearPersona: (datos) => repositorio.crearPersona(db, datos),
      actualizarPersona: (id, datos) =>
        repositorio.actualizarPersona(db, id, datos),
    },
    auditor
  );
}

export async function GET(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const busqueda = searchParams.get("busqueda") ?? undefined;

  const servicio = await crearServicio();
  const personas = await servicio.listarPersonas(busqueda);

  return NextResponse.json(personas);
}

export async function POST(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, 2);
  if (!verificacion.autorizado) {
    return NextResponse.json({ error: verificacion.error }, { status: 403 });
  }

  const cuerpo = await request.json();
  const servicio = await crearServicio();

  try {
    const persona = await servicio.crearPersona(cuerpo, sesion);
    return NextResponse.json(persona, { status: 201 });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "Error al crear persona";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
