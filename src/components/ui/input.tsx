import * as React from "react";

import { cn } from "@/lib/utils";
import { clasesCampoBase } from "./estilos-campo";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        clasesCampoBase,
        "selection:bg-primario selection:text-white file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      {...props}
    />
  );
}

export { Input };
