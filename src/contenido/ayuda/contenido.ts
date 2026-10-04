import type { ComponentType } from "react";
import { slugsConContenido, type SlugConContenido } from "./slugs";

const cargadores = new Map<SlugConContenido, () => Promise<{ default: ComponentType }>>([
  ["iniciar-sesion", () => import("./iniciar-sesion.mdx")],
  ["alcance-y-roles", () => import("./alcance-y-roles.mdx")],
  ["consultar-graduados", () => import("./consultar-graduados.mdx")],
  ["registrar-actas", () => import("./registrar-actas.mdx")],
  ["tomos-y-escaneos", () => import("./tomos-y-escaneos.mdx")],
  ["gestion-usuarios", () => import("./gestion-usuarios.mdx")],
  ["configuracion", () => import("./configuracion.mdx")],
  ["auditoria", () => import("./auditoria.mdx")],
]);

function tieneContenido(slug: string): slug is SlugConContenido {
  return (slugsConContenido as readonly string[]).includes(slug);
}

export async function cargarContenidoTema(slug: string): Promise<ComponentType | null> {
  if (!tieneContenido(slug)) return null;
  const cargador = cargadores.get(slug);
  if (!cargador) return null;
  const modulo = await cargador();
  return modulo.default;
}
