import { GRADUADOS, type Graduado } from "./graduados";

export type NivelRolSemilla = 1 | 2 | 3 | 4;

export const ROLES = [
  { nombre: "Admin País", nivel: 1 },
  { nombre: "Admin Regional", nivel: 2 },
  { nombre: "Admin Escuela", nivel: 3 },
  { nombre: "Staff", nivel: 4 },
] as const satisfies readonly { nombre: string; nivel: NivelRolSemilla }[];

export const REGIONES = [
  "Región Central",
  "Región Chorotega",
  "Región Pacífico Central",
  "Región Brunca",
  "Región Huetar Caribe",
  "Región Huetar Norte",
] as const;

export const TIPOS_ACTA = [
  "Certificado de Graduación",
  "Acta de Notas",
  "Traslado",
  "Convalidación",
] as const;

export type TipoActaSemilla = (typeof TIPOS_ACTA)[number];

export type EscuelaSemilla = {
  codigoMep: string;
  nombre: string;
  region: (typeof REGIONES)[number];
};

export const ESCUELAS: readonly EscuelaSemilla[] = [
  { codigoMep: "001", nombre: "Escuela Central", region: "Región Central" },
  { codigoMep: "002", nombre: "Liceo Experimental", region: "Región Central" },
  { codigoMep: "003", nombre: "Escuela Santa Ana", region: "Región Central" },
  { codigoMep: "101", nombre: "Colegio Chorotega", region: "Región Chorotega" },
  { codigoMep: "102", nombre: "Escuela Liberia", region: "Región Chorotega" },
  { codigoMep: "201", nombre: "Colegio Puntarenas", region: "Región Pacífico Central" },
  { codigoMep: "301", nombre: "Liceo Pérez Zeledón", region: "Región Brunca" },
];

export type PersonalSemilla = {
  identificacion: string;
  nombres: string;
  apellidos: string;
  puesto: string;
  escuelas: readonly string[];
  usuario?: { email: string; nivel: NivelRolSemilla };
  rolFirma?: string;
};

export const PERSONAL: readonly PersonalSemilla[] = [
  {
    identificacion: "111111111",
    nombres: "Admin",
    apellidos: "País",
    puesto: "Director Nacional",
    escuelas: ["001"],
    usuario: { email: "admin@pais.local", nivel: 1 },
  },
  {
    identificacion: "222222222",
    nombres: "Admin",
    apellidos: "Regional",
    puesto: "Director Regional",
    escuelas: ["002", "003"],
    usuario: { email: "admin@regional.local", nivel: 2 },
    rolFirma: "Supervisor Regional",
  },
  {
    identificacion: "333333333",
    nombres: "Admin",
    apellidos: "Escuela",
    puesto: "Director Escuela",
    escuelas: ["001"],
    usuario: { email: "admin@escuela.local", nivel: 3 },
    rolFirma: "Director",
  },
  {
    identificacion: "444444444",
    nombres: "Staff",
    apellidos: "General",
    puesto: "Asistente",
    escuelas: ["001"],
    usuario: { email: "staff@local", nivel: 4 },
    rolFirma: "Secretaría",
  },
  {
    identificacion: "555000001",
    nombres: "Marta",
    apellidos: "Sandoval Quirós",
    puesto: "Directora Liceo",
    escuelas: ["002"],
    usuario: { email: "admin.liceo@escuela.local", nivel: 3 },
    rolFirma: "Director",
  },
  {
    identificacion: "555000002",
    nombres: "Esteban",
    apellidos: "Calderón Mora",
    puesto: "Asistente Liceo",
    escuelas: ["002"],
    usuario: { email: "staff.liceo@local", nivel: 4 },
    rolFirma: "Secretaría",
  },
  {
    identificacion: "555000003",
    nombres: "Rocío",
    apellidos: "Baltodano Cruz",
    puesto: "Directora Regional Chorotega",
    escuelas: ["101", "102"],
    usuario: { email: "admin.chorotega@regional.local", nivel: 2 },
    rolFirma: "Supervisor Regional",
  },
  {
    identificacion: "555000004",
    nombres: "Wilberth",
    apellidos: "Matarrita Obando",
    puesto: "Director Colegio Chorotega",
    escuelas: ["101"],
    usuario: { email: "admin.chorotega@escuela.local", nivel: 3 },
    rolFirma: "Director",
  },
  {
    identificacion: "555000005",
    nombres: "Yorleny",
    apellidos: "Ruiz Elizondo",
    puesto: "Asistente Colegio Chorotega",
    escuelas: ["101"],
    usuario: { email: "staff.chorotega@local", nivel: 4 },
    rolFirma: "Secretaría",
  },
  {
    identificacion: "555000006",
    nombres: "Kenneth",
    apellidos: "Barrantes Solís",
    puesto: "Director Colegio Puntarenas",
    escuelas: ["201"],
    usuario: { email: "admin.puntarenas@escuela.local", nivel: 3 },
    rolFirma: "Director",
  },
  {
    identificacion: "555000007",
    nombres: "Adriana",
    apellidos: "Ureña Badilla",
    puesto: "Directora Liceo Pérez Zeledón",
    escuelas: ["301"],
    usuario: { email: "admin.brunca@escuela.local", nivel: 3 },
    rolFirma: "Director",
  },
  {
    identificacion: "555000008",
    nombres: "Gerardo",
    apellidos: "Salas Jiménez",
    puesto: "Secretario Escuela Liberia",
    escuelas: ["102"],
    rolFirma: "Secretaría",
  },
];

export type ActaSemilla = {
  escuela: string;
  tipo: TipoActaSemilla;
  anio: number;
  numeroTomo: number;
  folioInicio: number;
  folioFin: number;
  estudiantes: readonly Graduado[];
  certificadoInicial: number;
};

export const ACTAS: readonly ActaSemilla[] = [
  { escuela: "001", tipo: "Certificado de Graduación", anio: 2020, numeroTomo: 12, folioInicio: 1, folioFin: 18, estudiantes: GRADUADOS.slice(0, 12), certificadoInicial: 10001 },
  { escuela: "001", tipo: "Certificado de Graduación", anio: 2022, numeroTomo: 14, folioInicio: 1, folioFin: 15, estudiantes: GRADUADOS.slice(12, 24), certificadoInicial: 10101 },
  { escuela: "001", tipo: "Certificado de Graduación", anio: 2024, numeroTomo: 16, folioInicio: 1, folioFin: 14, estudiantes: GRADUADOS.slice(24, 35), certificadoInicial: 10201 },
  { escuela: "001", tipo: "Acta de Notas", anio: 2023, numeroTomo: 20, folioInicio: 1, folioFin: 9, estudiantes: [], certificadoInicial: 0 },
  { escuela: "002", tipo: "Certificado de Graduación", anio: 2021, numeroTomo: 8, folioInicio: 1, folioFin: 12, estudiantes: GRADUADOS.slice(35, 44), certificadoInicial: 20001 },
  { escuela: "002", tipo: "Certificado de Graduación", anio: 2023, numeroTomo: 9, folioInicio: 1, folioFin: 10, estudiantes: GRADUADOS.slice(44, 50), certificadoInicial: 20101 },
  { escuela: "002", tipo: "Traslado", anio: 2024, numeroTomo: 3, folioInicio: 1, folioFin: 6, estudiantes: GRADUADOS.slice(4, 7), certificadoInicial: 20201 },
  { escuela: "003", tipo: "Certificado de Graduación", anio: 2023, numeroTomo: 3, folioInicio: 1, folioFin: 8, estudiantes: GRADUADOS.slice(7, 15), certificadoInicial: 30001 },
  { escuela: "101", tipo: "Certificado de Graduación", anio: 2022, numeroTomo: 5, folioInicio: 1, folioFin: 8, estudiantes: [GRADUADOS[0], GRADUADOS[4], GRADUADOS[8], GRADUADOS[12], GRADUADOS[16], GRADUADOS[20], GRADUADOS[24], GRADUADOS[28]], certificadoInicial: 40001 },
  { escuela: "101", tipo: "Convalidación", anio: 2023, numeroTomo: 6, folioInicio: 1, folioFin: 5, estudiantes: GRADUADOS.slice(30, 33), certificadoInicial: 40101 },
  { escuela: "102", tipo: "Certificado de Graduación", anio: 2024, numeroTomo: 2, folioInicio: 1, folioFin: 7, estudiantes: GRADUADOS.slice(33, 40), certificadoInicial: 50001 },
  { escuela: "102", tipo: "Acta de Notas", anio: 2022, numeroTomo: 1, folioInicio: 1, folioFin: 6, estudiantes: [], certificadoInicial: 0 },
  { escuela: "201", tipo: "Certificado de Graduación", anio: 2022, numeroTomo: 4, folioInicio: 1, folioFin: 9, estudiantes: GRADUADOS.slice(15, 23), certificadoInicial: 60001 },
  { escuela: "201", tipo: "Acta de Notas", anio: 2024, numeroTomo: 5, folioInicio: 1, folioFin: 6, estudiantes: [], certificadoInicial: 0 },
  { escuela: "301", tipo: "Certificado de Graduación", anio: 2021, numeroTomo: 1, folioInicio: 1, folioFin: 10, estudiantes: GRADUADOS.slice(40, 48), certificadoInicial: 70001 },
];
