import { NextRequest, NextResponse } from "next/server";
import { crearServicioEscaneosDesdeDb } from "@/server/servicios/escaneos.fabrica";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { derivarAmbitoConsulta } from "@/server/auth/ambito";

export async function GET(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const escuelaId = Number(new URL(request.url).searchParams.get("escuelaId"));
  if (!Number.isInteger(escuelaId) || escuelaId <= 0) {
    return NextResponse.json(
      {
        error:
          "Debe indicar la escuela: cada escuela tiene sus propios tomos y folios",
      },
      { status: 400 }
    );
  }

  const servicio = crearServicioEscaneosDesdeDb(clienteDb());
  const resumen = await servicio.listarResumenTomos(
    escuelaId,
    derivarAmbitoConsulta(sesion)
  );

  return NextResponse.json(resumen);
}
