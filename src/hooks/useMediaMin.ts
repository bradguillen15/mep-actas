"use client";

import { useEffect, useState } from "react";

export function useMediaMin(anchoPx: number): boolean {
  const [coincide, setCoincide] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return true;
    }
    return window.matchMedia(`(min-width: ${anchoPx}px)`).matches;
  });

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const consulta = window.matchMedia(`(min-width: ${anchoPx}px)`);
    const actualizar = () => setCoincide(consulta.matches);
    actualizar();
    consulta.addEventListener("change", actualizar);
    return () => consulta.removeEventListener("change", actualizar);
  }, [anchoPx]);

  return coincide;
}
