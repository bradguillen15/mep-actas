export const obtenerJson = <T>(url: string): Promise<T> =>
  fetch(url).then((respuesta) => respuesta.json());

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
