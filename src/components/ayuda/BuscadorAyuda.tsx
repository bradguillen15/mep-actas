"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  CircleHelp,
  FileText,
  History,
  LogIn,
  Search,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Campo, EstadoVacio } from "@/components/ui";
import { buscarTemas, type TemaAyuda } from "@/lib/ayuda/temas";

const ICONO_POR_TEMA: Record<string, LucideIcon> = {
  "iniciar-sesion": LogIn,
  "alcance-y-roles": ShieldCheck,
  "consultar-graduados": Search,
  "registrar-actas": FileText,
  "tomos-y-escaneos": BookOpen,
  "gestion-usuarios": Users,
  configuracion: Settings,
  auditoria: History,
};

interface BuscadorAyudaProps {
  temas: TemaAyuda[];
}

export function BuscadorAyuda({ temas }: BuscadorAyudaProps) {
  const [consulta, setConsulta] = useState("");
  const resultados = useMemo(() => buscarTemas(temas, consulta), [temas, consulta]);

  return (
    <div className="space-y-6">
      <Campo
        label="Buscar en la ayuda"
        type="search"
        value={consulta}
        onChange={(evento) => setConsulta(evento.target.value)}
        placeholder="Escriba un tema o una palabra clave"
      />

      {resultados.length === 0 ? (
        <EstadoVacio
          mensaje="No se encontraron temas"
          descripcion="Pruebe con otra palabra o borre la búsqueda para ver todos los temas."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {resultados.map((tema) => {
            const Icono = ICONO_POR_TEMA[tema.slug] ?? CircleHelp;
            return (
              <li key={tema.slug}>
                <Link
                  href={`/ayuda/${tema.slug}`}
                  className="group flex h-full items-start gap-4 rounded-xl border border-borde bg-fondo p-4 shadow-xs transition-[border-color,box-shadow] duration-150 hover-fino:border-acento hover-fino:shadow-sm focus-visible:outline-2 focus-visible:outline-primario"
                >
                  <span
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primario text-acento"
                  >
                    <Icono className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-primario">{tema.titulo}</span>
                    <span className="mt-1 block text-sm text-texto-suave">{tema.descripcion}</span>
                  </span>
                  <ChevronRight
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0 text-texto-suave transition-[color,transform] duration-150 group-hover:translate-x-0.5 group-hover:text-acento-texto"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
