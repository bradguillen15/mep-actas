import { useState } from "react";

export function useValorRetenido<T>(valor: T | null): T | null {
  const [ultimo, setUltimo] = useState<T | null>(valor);
  if (valor !== null && valor !== ultimo) setUltimo(valor);
  return valor ?? ultimo;
}
