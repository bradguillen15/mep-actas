export interface EstudianteFormulario {
  identificacion: string;
  nombres: string;
  apellidos: string;
  numeroCertificado: string;
}

export interface ValoresFormularioActa {
  escuelaId: string;
  tipoActaId: string;
  titulo: string;
  numeroTomo: string;
  folioInicio: string;
  folioFin: string;
  fecha: string;
  actaReferenciaId: string;
}

export interface EstudianteRegistrado {
  id: number;
  identificacion: string;
  nombres: string;
  apellidos: string;
  numeroCertificado: number;
}

export interface ActaDetallada {
  id: number;
  escuelaId: number;
  tipoActaId: number;
  titulo: string;
  numeroTomo: number;
  folioInicio: number;
  folioFin: number;
  fecha: string;
  actaReferenciaId: number | null;
}
