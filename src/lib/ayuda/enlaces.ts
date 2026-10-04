export type ClaseEnlace = "interno" | "externo" | "inseguro";

export function clasificarEnlace(href: string): ClaseEnlace {
  const limpio = href.replace(/[\u0000- \u007f]/g, "");

  if (limpio.startsWith("#")) return "interno";
  if (limpio.startsWith("/")) return limpio.startsWith("//") ? "inseguro" : "interno";
  if (/^(https?:|mailto:)/i.test(limpio)) return "externo";
  return "inseguro";
}
