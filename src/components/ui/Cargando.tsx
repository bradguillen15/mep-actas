import { cn } from "@/lib/utils";

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      role="status"
      aria-label="Cargando"
      className={cn("animate-[spin_0.7s_linear_infinite] text-primario", className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function Cargando({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <Spinner className="size-8" />
    </div>
  );
}

export function CargandoChico({ className }: { className?: string }) {
  return <Spinner className={cn("size-4", className)} />;
}
