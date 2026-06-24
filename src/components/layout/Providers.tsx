"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SesionProvider, useSesionContext } from "@/contextos/SesionContext";
import { Sidebar } from "./Sidebar";
import { Cargando } from "../ui/Cargando";

function ContenidoLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { cargando } = useSesionContext();

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
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-superficie p-8">
        {children}
      </main>
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
