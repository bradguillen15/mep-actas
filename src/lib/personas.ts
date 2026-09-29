export type DatosPersonaEstudiante = {
  identificacion: string;
  nombres: string;
  apellidos: string;
};

type PersonaEncontrada = { id: number; identificacion: string };

type Solicitar = (url: string, opciones?: RequestInit) => Promise<Response>;

export async function resolverPersonaPorIdentificacion(
  datos: DatosPersonaEstudiante,
  solicitar: Solicitar = fetch
): Promise<number> {
  const resBusqueda = await solicitar(
    `/api/personas?identificacion=${encodeURIComponent(datos.identificacion)}`
  );
  if (!resBusqueda.ok) throw new Error("Error al buscar persona");

  const personas: PersonaEncontrada[] = await resBusqueda.json();
  const coincidencia = personas.find(
    (persona) => persona.identificacion === datos.identificacion
  );
  if (coincidencia) return coincidencia.id;

  const resNueva = await solicitar("/api/personas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identificacion: datos.identificacion,
      nombres: datos.nombres,
      apellidos: datos.apellidos,
    }),
  });
  if (!resNueva.ok) throw new Error("Error al crear persona");
  const nueva: { id: number } = await resNueva.json();
  return nueva.id;
}
