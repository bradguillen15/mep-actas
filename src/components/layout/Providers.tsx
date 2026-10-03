"use client";

import { useCallback, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SesionProvider, useSesionContext } from "@/contextos/SesionContext";
import { EncabezadoShellProvider } from "@/contextos/EncabezadoShellContext";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { CajonNavegacion } from "./CajonNavegacion";
import { Esqueleto } from "../ui/Esqueleto";
import { Notificador } from "../ui/Notificaciones";
import { TooltipProvider } from "../ui/tooltip";

function EsqueletoShell() {
  return (
    <div role="status" aria-label="Cargando" className="flex h-dvh overflow-hidden">
      <div className="hidden w-64 shrink-0 bg-primario md:block" />
      <div className="flex flex-1 flex-col">
        <div className="h-16 shrink-0 bg-primario" />
        <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Esqueleto className="h-8 w-48" />
          <Esqueleto className="h-4 w-full max-w-md" />
          <Esqueleto className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}

function ContenidoLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { cargando } = useSesionContext();
  const [abiertoEn, setAbiertoEn] = useState<string | null>(null);
  const menuAbierto = abiertoEn === pathname;
  const cerrarMenu = useCallback(() => setAbiertoEn(null), []);

  if (pathname === "/iniciar-sesion") {
    return <>{children}</>;
  }

  if (cargando) {
    return <EsqueletoShell />;
  }

  return (
    <EncabezadoShellProvider>
      <div className="flex h-dvh overflow-hidden">
        <div className="hidden w-64 shrink-0 md:block">
          <Sidebar />
        </div>
        <CajonNavegacion abierto={menuAbierto} onCerrar={cerrarMenu} />
        <div inert={menuAbierto} className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header menuAbierto={menuAbierto} onAbrirMenu={() => setAbiertoEn(pathname)} />
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-superficie">
            <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </EncabezadoShellProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SesionProvider>
      <TooltipProvider delayDuration={300}>
        <ContenidoLayout>{children}</ContenidoLayout>
        <Notificador />
      </TooltipProvider>
    </SesionProvider>
  );
}
