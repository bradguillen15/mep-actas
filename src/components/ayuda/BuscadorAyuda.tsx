"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Campo, EstadoVacio } from "@/components/ui";
import { buscarTemas, type TemaAyuda } from "@/lib/ayuda/temas";

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
          {resultados.map((tema) => (
            <li key={tema.slug}>
              <Link
                href={`/ayuda/${tema.slug}`}
                className="block h-full rounded-lg border border-borde bg-fondo p-4 transition-colors hover:border-primario hover:bg-superficie focus-visible:outline-2 focus-visible:outline-primario"
              >
                <span className="block font-semibold text-primario">{tema.titulo}</span>
                <span className="mt-1 block text-sm text-texto">{tema.descripcion}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
