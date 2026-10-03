async function mutarJson(
  url: string,
  metodo: "POST" | "PATCH" | "DELETE",
  mensajeError: string,
  cuerpo?: unknown
): Promise<void> {
  const opciones: RequestInit = { method: metodo };
  if (cuerpo !== undefined) {
    opciones.headers = { "Content-Type": "application/json" };
    opciones.body = JSON.stringify(cuerpo);
  }

  const respuesta = await fetch(url, opciones);
  if (!respuesta.ok) {
    const detalle = await respuesta.json().catch(() => ({}));
    throw new Error(
      (detalle as { error?: string }).error ?? mensajeError
    );
  }
}

export async function enviarJson(
  url: string,
  cuerpo: unknown,
  mensajeError: string
): Promise<void> {
  await mutarJson(url, "POST", mensajeError, cuerpo);
}

export async function patchJson(
  url: string,
  cuerpo: unknown,
  mensajeError: string
): Promise<void> {
  await mutarJson(url, "PATCH", mensajeError, cuerpo);
}

export async function eliminarJson(
  url: string,
  mensajeError: string
): Promise<void> {
  await mutarJson(url, "DELETE", mensajeError);
}

export async function obtenerJsonEstricto<T>(url: string): Promise<T> {
  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    throw new Error(`Error ${respuesta.status} al consultar ${url}`);
  }
  return respuesta.json();
}
