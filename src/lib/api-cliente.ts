export async function enviarJson(
  url: string,
  cuerpo: unknown,
  mensajeError: string
): Promise<void> {
  const respuesta = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  if (!respuesta.ok) {
    const detalle = await respuesta.json().catch(() => ({}));
    throw new Error(detalle.error ?? mensajeError);
  }
}

export async function obtenerJsonEstricto<T>(url: string): Promise<T> {
  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    throw new Error(`Error ${respuesta.status} al consultar ${url}`);
  }
  return respuesta.json();
}
