"use client";

import { Toaster } from "sonner";

export { toast } from "sonner";

export function Notificador() {
  return (
    <Toaster
      position="top-right"
      richColors={false}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!rounded-lg !border !border-borde !bg-white !text-texto !shadow-md !font-sans",
          description: "!text-texto-suave",
          closeButton: "!border-borde !bg-white !text-texto-suave",
          success: "[&_[data-icon]]:!text-exito",
          error: "[&_[data-icon]]:!text-error",
        },
      }}
    />
  );
}
