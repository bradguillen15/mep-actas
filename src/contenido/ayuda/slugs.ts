export const slugsConContenido = [
  "iniciar-sesion",
  "alcance-y-roles",
  "consultar-graduados",
  "registrar-actas",
  "tomos-y-escaneos",
  "gestion-usuarios",
  "configuracion",
  "auditoria",
] as const;

export type SlugConContenido = (typeof slugsConContenido)[number];
