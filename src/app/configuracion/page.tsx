"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GestionEscuelas } from "@/components/configuracion/GestionEscuelas";
import { GestionRegiones } from "@/components/configuracion/GestionRegiones";
import { GestionTiposActa } from "@/components/configuracion/GestionTiposActa";
import { EncabezadoPagina, Pestanas } from "@/components/ui";

type IdPestana = "tipos-acta" | "regiones" | "escuelas";

const pestanas: { id: IdPestana; etiqueta: string }[] = [
  { id: "tipos-acta", etiqueta: "Tipos de acta" },
  { id: "regiones", etiqueta: "Regiones" },
  { id: "escuelas", etiqueta: "Escuelas" },
];

const PESTANA_POR_DEFECTO: IdPestana = "tipos-acta";

const esPestanaValida = (valor: string | null): valor is IdPestana =>
  pestanas.some((p) => p.id === valor);

function ContenidoConfiguracion() {
  const router = useRouter();
  const ruta = usePathname();
  const parametros = useSearchParams();
  const valorTab = parametros.get("tab");
  const pestanaActiva = esPestanaValida(valorTab) ? valorTab : PESTANA_POR_DEFECTO;

  const cambiarPestana = (id: string) => {
    router.replace(`${ruta}?tab=${id}`, { scroll: false });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <EncabezadoPagina
        titulo="Configuración"
        descripcion="Administración del sistema."
      />

      <Pestanas
        etiqueta="Secciones de configuración"
        pestanas={pestanas}
        activa={pestanaActiva}
        onCambiar={cambiarPestana}
      >
        {pestanaActiva === "tipos-acta" && <GestionTiposActa />}
        {pestanaActiva === "regiones" && <GestionRegiones />}
        {pestanaActiva === "escuelas" && <GestionEscuelas />}
      </Pestanas>
    </div>
  );
}

export default function Configuracion() {
  return (
    <Suspense>
      <ContenidoConfiguracion />
    </Suspense>
  );
}
