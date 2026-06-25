import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import { Input } from "./input";
import { Label } from "./label";

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Campo({ label, error, className, id, ...props }: CampoProps) {
  const idReal = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <Label htmlFor={idReal} className="text-texto">
          {label}
        </Label>
      )}
      <Input
        id={idReal}
        aria-invalid={error ? true : undefined}
        className={cn(
          "h-10 rounded-lg bg-white text-texto focus-visible:ring-primario/40 focus-visible:ring-2 focus-visible:border-primario disabled:bg-superficie",
          error && "border-error focus-visible:ring-error/40",
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
