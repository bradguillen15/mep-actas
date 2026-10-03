const formatoCorto = new Intl.DateTimeFormat("es-CR", {
  dateStyle: "medium",
  timeStyle: "short",
});

const formatoCompleto = new Intl.DateTimeFormat("es-CR", {
  dateStyle: "full",
  timeStyle: "medium",
});

const esValida = (fecha: Date) => !Number.isNaN(fecha.getTime());

export function formatearFechaCorta(valor: string | Date): string {
  const fecha = new Date(valor);
  return esValida(fecha) ? formatoCorto.format(fecha) : String(valor);
}

export function formatearFechaCompleta(valor: string | Date): string {
  const fecha = new Date(valor);
  return esValida(fecha) ? formatoCompleto.format(fecha) : String(valor);
}
