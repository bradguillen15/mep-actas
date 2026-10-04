import { useSesionContext } from "@/contextos/SesionContext";

export function useSesion() {
  return useSesionContext();
}
