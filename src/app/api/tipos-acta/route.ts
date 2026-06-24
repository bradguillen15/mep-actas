import { NextResponse } from "next/server";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
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
