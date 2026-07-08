import { NextResponse, NextRequest } from "next/server";
import { crearServicioGraduaciones } from "@/server/servicios/graduaciones.servicio";
import * as repositorio from "@/server/repositorios/graduaciones.repositorio";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";

const db = clienteDb();

function parametroOpcional(
  searchParams: URLSearchParams,
  clave: string
): string | undefined {
  const valor = searchParams.get(clave);
  return valor && valor.trim() !== "" ? valor : undefined;
}

export async function GET(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const escuelaIdParam = searchParams.get("escuelaId");
  const tipoActaIdParam = searchParams.get("tipoActaId");

  const paginaParam = searchParams.get("pagina");
  const limiteParam = searchParams.get("limite");

  const servicio = crearServicioGraduaciones({
    buscarGraduaciones: (params) =>
      repositorio.buscarGraduaciones(db, params),
    obtenerGraduacionPorId: (id) =>
      repositorio.obtenerGraduacionPorId(db, id),
  });

  const resultados = await servicio.buscar({
    identificacion: parametroOpcional(searchParams, "identificacion"),
    nombre: parametroOpcional(searchParams, "nombre"),
    escuelaId: escuelaIdParam ? Number(escuelaIdParam) : undefined,
    tipoActaId: tipoActaIdParam ? Number(tipoActaIdParam) : undefined,
    fechaDesde: parametroOpcional(searchParams, "fechaDesde"),
    fechaHasta: parametroOpcional(searchParams, "fechaHasta"),
    numeroCertificado: parametroOpcional(searchParams, "numeroCertificado"),
    tituloActa: parametroOpcional(searchParams, "tituloActa"),
    pagina: paginaParam ? Number(paginaParam) : undefined,
    limite: limiteParam ? Number(limiteParam) : undefined,
  });

  return NextResponse.json(resultados);
}
