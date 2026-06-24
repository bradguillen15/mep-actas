import { NextResponse, NextRequest } from "next/server";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";
import { eq } from "drizzle-orm";
import * as esquema from "@/db/esquema";

export async function GET() {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = clienteDb();
  const tipos = await db
    .select({ id: esquema.tiposActas.id, nombre: esquema.tiposActas.nombre })
    .from(esquema.tiposActas)
    .where(eq(esquema.tiposActas.activo, true));

  return NextResponse.json(tipos);
}

export async function POST(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, 3);
  if (!verificacion.autorizado) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { nombre } = await request.json();
  if (!nombre) {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
  }

  const db = clienteDb();
  const [tipo] = await db
    .insert(esquema.tiposActas)
    .values({ nombre })
    .returning()
    .all();

  return NextResponse.json(tipo, { status: 201 });
}
