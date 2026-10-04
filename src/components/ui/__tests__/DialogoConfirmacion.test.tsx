// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DialogoConfirmacion } from "../DialogoConfirmacion";

function renderizar(
  propiedades: Partial<React.ComponentProps<typeof DialogoConfirmacion>> = {}
) {
  const onCerrar = vi.fn();
  const onConfirmar = vi.fn();
  render(
    <DialogoConfirmacion
      abierto
      onCerrar={onCerrar}
      onConfirmar={onConfirmar}
      titulo="Desactivar usuario"
      descripcion="Perderá el acceso."
      {...propiedades}
    />
  );
  return { onCerrar, onConfirmar };
}

describe("DialogoConfirmacion", () => {
  it("muestra título y descripción", () => {
    renderizar();
    expect(screen.getByText("Desactivar usuario")).toBeInTheDocument();
    expect(screen.getByText("Perderá el acceso.")).toBeInTheDocument();
  });

  it("llama a onConfirmar", async () => {
    const { onConfirmar } = renderizar({ etiquetaConfirmar: "Desactivar" });
    await userEvent.click(screen.getByRole("button", { name: "Desactivar" }));
    expect(onConfirmar).toHaveBeenCalledTimes(1);
  });

  it("Cancelar cierra sin confirmar", async () => {
    const { onCerrar, onConfirmar } = renderizar();
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCerrar).toHaveBeenCalledTimes(1);
    expect(onConfirmar).not.toHaveBeenCalled();
  });

  it("deshabilita ambos botones mientras la confirmación asíncrona está en curso", async () => {
    let resolver: () => void = () => {};
    const onConfirmar = vi.fn(() => new Promise<void>((r) => (resolver = r)));
    renderizar({ onConfirmar });
    await userEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(screen.getByRole("button", { name: "Confirmar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    resolver();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Cancelar" })).toBeEnabled()
    );
  });

  it("ignora Escape mientras la confirmación está en curso", async () => {
    let resolver: () => void = () => {};
    const onConfirmar = vi.fn(() => new Promise<void>((r) => (resolver = r)));
    const { onCerrar } = renderizar({ onConfirmar });
    await userEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    await userEvent.keyboard("{Escape}");
    expect(onCerrar).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Cerrar" })).toBeDisabled();

    resolver();
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancelar" })).toBeEnabled());
    await userEvent.keyboard("{Escape}");
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it("ignora el clic fuera del diálogo mientras confirma", async () => {
    let resolver: () => void = () => {};
    const onConfirmar = vi.fn(() => new Promise<void>((r) => (resolver = r)));
    const { onCerrar } = renderizar({ onConfirmar });
    await userEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    await userEvent.click(document.querySelector("[data-slot='dialog-overlay']")!);
    expect(onCerrar).not.toHaveBeenCalled();
    resolver();
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancelar" })).toBeEnabled());
  });
});
