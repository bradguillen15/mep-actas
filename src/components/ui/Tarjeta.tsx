import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Card } from "./card";

interface TarjetaProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export function Tarjeta({ children, className, padding = true }: TarjetaProps) {
  return (
    <Card
      className={cn("gap-0 rounded-xl border-borde bg-white", padding && "p-6", className)}
    >
      {children}
    </Card>
  );
}
