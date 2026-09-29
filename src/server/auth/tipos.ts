export type NivelRol = 1 | 2 | 3 | 4;

export interface SesionUsuario {
  usuarioId: number;
  email: string;
  rolId: number;
  nivel: NivelRol;
  funcionarioId: number;
  escuelaId?: number;
  regionId?: number;
}

export interface AmbitoVerificacion {
  escuelaId?: number;
  // Con `escuelaId`, es la región de esa escuela resuelta en el servidor; nunca la envía el cliente.
  regionId?: number;
}

export interface ResultadoVerificacion {
  autorizado: boolean;
  error?: 401 | 403;
  usuario?: SesionUsuario;
}

export const NIVELES: Record<string, NivelRol> = {
  ADMIN_PAIS: 1,
  ADMIN_REGIONAL: 2,
  ADMIN_ESCUELA: 3,
  STAFF: 4,
} as const;
