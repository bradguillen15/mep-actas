import type { ReactNode } from "react";

interface TarjetaProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export function Tarjeta({
  children,
  className = "",
  padding = true,
}: TarjetaProps) {
  return (
    <div
      className={`rounded-xl border border-borde bg-white ${padding ? "p-6" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
