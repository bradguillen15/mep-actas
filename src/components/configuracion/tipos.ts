export interface Region {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface Escuela {
  id: number;
  nombre: string;
  codigoMep: string;
  regionId: number;
  activo: boolean;
}

export interface TipoActa {
  id: number;
  nombre: string;
}

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  nivel: number;
  escuela: string;
  activo: boolean;
}
