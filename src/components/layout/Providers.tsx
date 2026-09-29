"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SesionProvider, useSesionContext } from "@/contextos/SesionContext";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Cargando } from "../ui/Cargando";

function ContenidoLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { cargando } = useSesionContext();
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    if (!menuAbierto) return;
    const cerrarConEscape = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setMenuAbierto(false);
    };
    window.addEventListener("keydown", cerrarConEscape);
    return () => window.removeEventListener("keydown", cerrarConEscape);
  }, [menuAbierto]);

  if (pathname === "/iniciar-sesion") {
    return <>{children}</>;
  }

  if (cargando) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Cargando />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      {menuAbierto && (
        <div
          role="dialog"
          aria-label="Menú de navegación"
          className="fixed inset-0 z-50 flex md:hidden"
        >
          <button
            type="button"
            aria-label="Cerrar menú de navegación"
            onClick={() => setMenuAbierto(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="relative z-10 shadow-xl">
            <Sidebar onNavegar={() => setMenuAbierto(false)} />
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onAbrirMenu={() => setMenuAbierto(true)} />
        <main className="flex-1 overflow-y-auto bg-superficie p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SesionProvider>
      <ContenidoLayout>{children}</ContenidoLayout>
    </SesionProvider>
  );
}
