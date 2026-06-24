type VarianteBadge = "info" | "exito" | "advertencia" | "error" | "neutral";

interface BadgeProps {
  variante?: VarianteBadge;
  children: string;
}

const clases: Record<VarianteBadge, string> = {
  info: "bg-primario/10 text-primario",
  exito: "bg-exito/10 text-exito",
  advertencia: "bg-acento/10 text-acento",
  error: "bg-error/10 text-error",
  neutral: "bg-superficie text-texto",
};

export function Badge({ variante = "neutral", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${clases[variante as keyof typeof clases]}`}
    >
      {children}
    </span>
  );
}
