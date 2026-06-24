"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useSesion } from "./useSesion";

interface Escuela {
  id: number;
  nombre: string;
  codigoMep: string;
  regionId: number;
}

export function useEscuelaActual() {
  const { usuario } = useSesion();
  const puedeElegirEscuela =
    usuario !== null && (usuario.nivel === 1 || usuario.nivel === 2);
  const [escuelaId, setEscuelaId] = useState<number | undefined>(undefined);

  const { data: escuelas = [], isLoading } = useSWR<Escuela[]>(
    puedeElegirEscuela ? "/api/escuelas" : null,
    (url: string) => fetch(url).then((r) => r.json())
  );

  useEffect(() => {
    if (!puedeElegirEscuela && usuario?.escuelaId) {
      setEscuelaId(usuario.escuelaId);
    }
  }, [usuario, puedeElegirEscuela]);

  const escuelaActual = escuelas.find((e) => e.id === escuelaId) ?? null;

  return {
    escuelaId,
    escuelaActual,
    escuelas,
    setEscuelaId,
    puedeElegirEscuela,
    isLoading,
  };
}
