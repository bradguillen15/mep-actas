"use client";

import { createContext, useContext, type ReactNode } from "react";
import useSWR from "swr";
import type { NivelRol } from "@/server/auth/tipos";

interface UsuarioSesion {
  usuarioId: number;
  email: string;
  nombre: string;
  rolId: number;
  nivel: NivelRol;
  funcionarioId: number;
  escuelaId?: number;
  regionId?: number;
}

interface SesionContextType {
  usuario: UsuarioSesion | null;
  cargando: boolean;
  refrescar: () => Promise<unknown>;
  cerrarSesion: () => Promise<void>;
}

const SesionContext = createContext<SesionContextType | null>(null);

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.user) return null;
  return {
    usuarioId: data.user.usuarioId,
    email: data.user.email,
    nombre: data.user.name ?? data.user.email,
    rolId: data.user.rolId,
    nivel: data.user.nivel as NivelRol,
    funcionarioId: data.user.funcionarioId,
    escuelaId: data.user.escuelaId,
    regionId: data.user.regionId,
  } as UsuarioSesion;
}

export function SesionProvider({ children }: { children: ReactNode }) {
  const {
    data: usuario = null,
    isLoading: cargando,
    mutate: refrescar,
  } = useSWR("/api/auth/session", fetcher, {
    revalidateOnFocus: false,
  });

  const cerrarSesion = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    await refrescar();
  };

  return (
    <SesionContext.Provider
      value={{ usuario, cargando: cargando as boolean, refrescar, cerrarSesion }}
    >
      {children}
    </SesionContext.Provider>
  );
}

export function useSesionContext() {
  const ctx = useContext(SesionContext);
  if (!ctx) throw new Error("useSesionContext debe usarse dentro de SesionProvider");
  return ctx;
}
