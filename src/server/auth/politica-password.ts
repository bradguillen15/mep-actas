const LONGITUD_MINIMA = 12;

export function validarPassword(password: string): string | null {
  if (password.length < LONGITUD_MINIMA) {
    return `La contraseña debe tener al menos ${LONGITUD_MINIMA} caracteres`;
  }
  return null;
}
