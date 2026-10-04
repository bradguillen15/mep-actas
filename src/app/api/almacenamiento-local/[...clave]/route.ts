import { NextRequest, NextResponse } from "next/server";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";
import { ambitoDeEscuelaObjetivo } from "@/server/auth/ambito";
import type { SesionUsuario } from "@/server/auth/tipos";
import { resolverAmbitoDeEscuela } from "@/server/repositorios/escuelas.repositorio";
import {
  directorioAlmacenamientoLocal,
  escribirArchivoLocal,
  leerArchivoLocal,
  resolverRutaLocal,
} from "@/server/almacenamiento/local";
import { modoLocalActivo } from "@/server/almacenamiento/seleccion";
import { TIPOS_CONTENIDO_PERMITIDOS } from "@/lib/escaneos";

type Parametros = { params: Promise<{ clave: string[] }> };

const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024;

function responderError(mensaje: string, status: number) {
  return NextResponse.json({ error: mensaje }, { status });
}

async function escuelaDeClaveAccesible(sesion: SesionUsuario, clave: string) {
  const escuelaId = Number(clave.split("/")[1]);
  const ambito = await ambitoDeEscuelaObjetivo(sesion, escuelaId, (id) =>
    resolverAmbitoDeEscuela(clienteDb(), id)
  );
  return verificarRol(sesion, 4, ambito).autorizado;
}

async function autorizar(parametros: Parametros) {
  if (!modoLocalActivo()) {
    return { respuesta: responderError("No encontrado", 404) };
  }

  const sesion = await obtenerSesion();
  if (!sesion) return { respuesta: responderError("No autorizado", 401) };

  const clave = (await parametros.params).clave.join("/");
  try {
    resolverRutaLocal(directorioAlmacenamientoLocal(), clave);
  } catch {
    return { respuesta: responderError("Clave inválida", 400) };
  }

  if (!(await escuelaDeClaveAccesible(sesion, clave))) {
    return { respuesta: responderError("No tiene permisos sobre este escaneo", 403) };
  }

  return { clave };
}

export async function GET(_request: NextRequest, parametros: Parametros) {
  const autorizacion = await autorizar(parametros);
  if (autorizacion.respuesta) return autorizacion.respuesta;

  const archivo = await leerArchivoLocal(
    directorioAlmacenamientoLocal(),
    autorizacion.clave
  );
  if (!archivo) return responderError("Archivo no encontrado", 404);

  return new NextResponse(new Uint8Array(archivo.contenido), {
    headers: {
      "Content-Type": archivo.tipoContenido,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function PUT(request: NextRequest, parametros: Parametros) {
  const autorizacion = await autorizar(parametros);
  if (autorizacion.respuesta) return autorizacion.respuesta;

  const tipoContenido = request.headers.get("content-type")?.split(";")[0].trim() ?? "";
  if (!TIPOS_CONTENIDO_PERMITIDOS.includes(tipoContenido)) {
    return responderError(
      `Tipo de contenido no permitido. Use: ${TIPOS_CONTENIDO_PERMITIDOS.join(", ")}`,
      415
    );
  }

  const contenido = Buffer.from(await request.arrayBuffer());
  if (contenido.length > TAMANO_MAXIMO_BYTES) {
    return responderError("El archivo supera el tamaño máximo de 10 MB", 413);
  }

  await escribirArchivoLocal(
    directorioAlmacenamientoLocal(),
    autorizacion.clave,
    contenido
  );
  return new NextResponse(null, { status: 204 });
}
