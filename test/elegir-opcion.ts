import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export async function elegirOpcion(
  etiqueta: string | RegExp,
  nombreOpcion: string,
  contenedor?: HTMLElement
): Promise<void> {
  const ambito = contenedor ? within(contenedor) : screen;
  await userEvent.click(ambito.getByRole("combobox", { name: etiqueta }));
  await userEvent.click(
    await screen.findByRole("option", { name: nombreOpcion })
  );
}

export async function etiquetasOpciones(
  etiqueta: string | RegExp,
  contenedor?: HTMLElement
): Promise<string[]> {
  const ambito = contenedor ? within(contenedor) : screen;
  await userEvent.click(ambito.getByRole("combobox", { name: etiqueta }));
  const opciones = await screen.findAllByRole("option");
  return opciones.map((opcion) => opcion.textContent ?? "");
}
