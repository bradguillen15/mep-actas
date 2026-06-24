"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
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
  refrescar: () => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const SesionContext = createContext<SesionContextType | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] = useState(true);

  const refrescar = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (!res.ok) {
        setUsuario(null);
        return;
      }
      const data = await res.json();
      if (data?.user) {
        setUsuario({
          usuarioId: data.user.usuarioId,
          email: data.user.email,
          nombre: data.user.name ?? data.user.email,
          rolId: data.user.rolId,
          nivel: data.user.nivel,
          funcionarioId: data.user.funcionarioId,
          escuelaId: data.user.escuelaId,
          regionId: data.user.regionId,
        });
      } else {
        setUsuario(null);
      }
    } catch {
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    setUsuario(null);
  };

  useEffect(() => {
    refrescar();
  }, []);

  return (
    <SesionContext.Provider
      value={{ usuario, cargando, refrescar, cerrarSesion }}
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
