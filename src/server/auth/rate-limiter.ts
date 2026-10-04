interface VentanaSliding {
  intentos: number[];
}

const almacenMemoria = new Map<string, VentanaSliding>();

const VENTANA_MS = 60_000;
const LIMITE_DEFAULT = 5;

export function rateLimiterLogin(
  ip: string
): { permitido: boolean; retryAfter?: number } {
  const ahora = Date.now();
  const limite = Number(process.env.LOGIN_RATE_LIMIT_MAX) || LIMITE_DEFAULT;

  let ventana = almacenMemoria.get(ip);
  if (!ventana) {
    ventana = { intentos: [] };
    almacenMemoria.set(ip, ventana);
  }

  ventana.intentos = ventana.intentos.filter(
    (ts) => ahora - ts < VENTANA_MS
  );

  if (ventana.intentos.length >= limite) {
    const intentoMasAntiguo = ventana.intentos[0];
    const retryAfter = Math.ceil(
      (intentoMasAntiguo + VENTANA_MS - ahora) / 1000
    );
    return { permitido: false, retryAfter };
  }

  ventana.intentos.push(ahora);
  return { permitido: true };
}

export function limpiarLimitadores(): void {
  almacenMemoria.clear();
}
