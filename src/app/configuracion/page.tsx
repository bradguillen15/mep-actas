"use client";

import { useState } from "react";
import { GestionEscuelas } from "@/components/configuracion/GestionEscuelas";
import { GestionRegiones } from "@/components/configuracion/GestionRegiones";
import { GestionTiposActa } from "@/components/configuracion/GestionTiposActa";
import { GestionUsuarios } from "@/components/configuracion/GestionUsuarios";

type Pestana = "usuarios" | "tipos-acta" | "regiones" | "escuelas";

const pestanas: { id: Pestana; etiqueta: string }[] = [
  { id: "usuarios", etiqueta: "Usuarios" },
  { id: "tipos-acta", etiqueta: "Tipos de acta" },
  { id: "regiones", etiqueta: "Regiones" },
  { id: "escuelas", etiqueta: "Escuelas" },
];

export default function Configuracion() {
  const [pestanaActiva, setPestanaActiva] = useState<Pestana>("usuarios");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-texto">Configuración</h1>
        <p className="mt-1 text-sm text-gray-500">
          Administración del sistema.
        </p>
      </div>

      <div className="flex gap-1 rounded-lg bg-superficie p-1 border border-borde w-fit">
        {pestanas.map((p) => (
          <button
            key={p.id}
            onClick={() => setPestanaActiva(p.id)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              pestanaActiva === p.id
                ? "bg-white text-texto shadow-sm"
                : "text-gray-500 hover:text-texto"
            }`}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>

      {pestanaActiva === "usuarios" && <GestionUsuarios />}
      {pestanaActiva === "tipos-acta" && <GestionTiposActa />}
      {pestanaActiva === "regiones" && <GestionRegiones />}
      {pestanaActiva === "escuelas" && <GestionEscuelas />}
    </div>
  );
}
