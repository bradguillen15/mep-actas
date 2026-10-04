// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModalFormulario } from "../ModalFormulario";

function renderizar(
  propiedades: Partial<React.ComponentProps<typeof ModalFormulario>> = {}
) {
  const onCerrar = vi.fn();
  const onEnviar = vi.fn().mockResolvedValue(undefined);
  render(
    <ModalFormulario
      abierto
      onCerrar={onCerrar}
      titulo="Nueva región"
      onEnviar={onEnviar}
      {...propiedades}
    >
      <input aria-label="Nombre" />
    </ModalFormulario>
  );
  return { onCerrar, onEnviar };
}

describe("ModalFormulario", () => {
  it("muestra el título y los campos", () => {
    renderizar();
    expect(screen.getByText("Nueva región")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
  });

  it("usa Guardar como texto de envío por defecto y permite personalizarlo", () => {
    renderizar({ textoEnviar: "Crear región" });
    expect(screen.getByRole("button", { name: "Crear región" })).toBeInTheDocument();
  });

  it("llama a onEnviar al presionar el botón de envío", async () => {
    const { onEnviar } = renderizar();
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(onEnviar).toHaveBeenCalledTimes(1);
  });

  it("envía con Enter desde un campo", async () => {
    const { onEnviar } = renderizar();
    await userEvent.type(screen.getByLabelText("Nombre"), "Central{Enter}");
    expect(onEnviar).toHaveBeenCalledTimes(1);
  });

  it("deshabilita el botón de envío mientras se procesa", async () => {
    let resolver: () => void = () => {};
    const onEnviar = vi.fn(
      () => new Promise<void>((resolve) => (resolver = resolve))
    );
    renderizar({ onEnviar });
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
    resolver();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Guardar" })).toBeEnabled()
    );
  });

  it("muestra el mensaje de error cuando onEnviar falla", async () => {
    renderizar({ onEnviar: vi.fn().mockRejectedValue(new Error("Nombre duplicado")) });
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Nombre duplicado");
  });

  it("no permite enviar cuando está deshabilitado", () => {
    renderizar({ deshabilitado: true });
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });

  it("cancelar llama a onCerrar", async () => {
    const { onCerrar } = renderizar();
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it("limpia el error al cerrar y reabrir", async () => {
    const onEnviar = vi.fn().mockRejectedValue(new Error("Falló"));
    const comun = { onCerrar: vi.fn(), titulo: "Nueva región", onEnviar };
    const { rerender } = render(
      <ModalFormulario abierto {...comun}>
        <input aria-label="Nombre" />
      </ModalFormulario>
    );
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    rerender(
      <ModalFormulario abierto={false} {...comun}>
        <input aria-label="Nombre" />
      </ModalFormulario>
    );
    rerender(
      <ModalFormulario abierto {...comun}>
        <input aria-label="Nombre" />
      </ModalFormulario>
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
