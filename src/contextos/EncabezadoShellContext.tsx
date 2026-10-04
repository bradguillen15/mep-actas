"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface EncabezadoRegistrado {
  titulo: string | null;
  descripcion: string | null;
}

interface EncabezadoShellContextType {
  encabezado: EncabezadoRegistrado;
  registrar: (titulo: string, descripcion?: string) => void;
  limpiar: () => void;
}

const EncabezadoShellContext = createContext<EncabezadoShellContextType | null>(null);

const VACIO: EncabezadoRegistrado = { titulo: null, descripcion: null };

export function EncabezadoShellProvider({ children }: { children: ReactNode }) {
  const [encabezado, setEncabezado] = useState<EncabezadoRegistrado>(VACIO);

  const registrar = useCallback((titulo: string, descripcion?: string) => {
    setEncabezado({ titulo, descripcion: descripcion ?? null });
  }, []);

  const limpiar = useCallback(() => {
    setEncabezado(VACIO);
  }, []);

  const valor = useMemo(
    () => ({ encabezado, registrar, limpiar }),
    [encabezado, registrar, limpiar]
  );

  return (
    <EncabezadoShellContext.Provider value={valor}>
      {children}
    </EncabezadoShellContext.Provider>
  );
}

export function useEncabezadoShell(): EncabezadoShellContextType {
  const contexto = useContext(EncabezadoShellContext);
  if (!contexto) {
    throw new Error("useEncabezadoShell debe usarse dentro de EncabezadoShellProvider");
  }
  return contexto;
}

export function useRegistrarEncabezado(titulo: string, descripcion?: string): void {
  const contexto = useContext(EncabezadoShellContext);
  const registrar = contexto?.registrar;
  const limpiar = contexto?.limpiar;

  useEffect(() => {
    if (!registrar || !limpiar) return;
    registrar(titulo, descripcion);
    return () => limpiar();
  }, [titulo, descripcion, registrar, limpiar]);
}

export function RegistrarEncabezado({
  titulo,
  descripcion,
}: {
  titulo: string;
  descripcion?: string;
}) {
  useRegistrarEncabezado(titulo, descripcion);
  return null;
}
