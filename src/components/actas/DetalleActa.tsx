"use client";

import { useState } from "react";

import { toast } from "@/components/ui/Notificaciones";
import { agregarEstudiantesAlActa } from "@/lib/actas-cliente";
import { EdicionDatosActa } from "./EdicionDatosActa";
import { ListaEstudiantesActa } from "./ListaEstudiantesActa";
import { ModalAgregarEstudiante } from "./ModalAgregarEstudiante";
import type {
  ActaDetallada,
  EstudianteFormulario,
  EstudianteRegistrado,
} from "./tipos";

interface DetalleActaProps {
  acta?: ActaDetallada;
  estudiantes?: EstudianteRegistrado[];
  escuelaFijaId?: number;
  tiposActa: { id: number; nombre: string }[];
  escuelas: { id: number; nombre: string }[];
  puedeElegirEscuela: boolean;
  onActualizado?: () => Promise<unknown> | void;
  onCreada?: (id: number) => void;
}

export function DetalleActa({
  acta,
  estudiantes = [],
  escuelaFijaId,
  tiposActa,
  escuelas,
  puedeElegirEscuela,
  onActualizado,
  onCreada,
}: DetalleActaProps) {
  const [modalAbierto, setModalAbierto] = useState(false);

  const agregarEstudiante = async (estudiante: EstudianteFormulario) => {
    if (!acta) return;
    await agregarEstudiantesAlActa(acta.id, [estudiante]);
    await onActualizado?.();
    setModalAbierto(false);
    toast.success("Estudiante agregado");
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:grid-rows-[minmax(0,1fr)]">
      <EdicionDatosActa
        acta={acta}
        escuelaFijaId={escuelaFijaId}
        tiposActa={tiposActa}
        escuelas={escuelas}
        puedeElegirEscuela={puedeElegirEscuela}
        onActualizado={onActualizado}
        onCreada={onCreada}
      />

      <ListaEstudiantesActa
        estudiantes={estudiantes}
        onAgregar={() => setModalAbierto(true)}
        agregarDeshabilitado={!acta}
        mensajeVacio={
          acta ? undefined : "Complete los datos del acta para agregar estudiantes."
        }
      />

      <ModalAgregarEstudiante
        abierto={Boolean(acta) && modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onAgregar={agregarEstudiante}
      />
    </div>
  );
}
