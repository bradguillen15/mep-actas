// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Selector } from "../Selector";

const OPCIONES = [
  { valor: "a", etiqueta: "Opción A" },
  { valor: "b", etiqueta: "Opción B" },
];

describe("Selector", () => {
  it("asocia la etiqueta con el disparador", () => {
    render(<Selector label="Escuela" opciones={OPCIONES} />);
    expect(screen.getByRole("combobox", { name: "Escuela" })).toBeInTheDocument();
  });

  it("muestra el placeholder cuando no hay valor", () => {
    render(
      <Selector
        label="Escuela"
        opciones={OPCIONES}
        placeholder="Seleccione una escuela"
      />
    );
    expect(screen.getByRole("combobox", { name: "Escuela" })).toHaveTextContent(
      "Seleccione una escuela"
    );
  });

  it("marca el campo como requerido y oculta el asterisco a los lectores", () => {
    render(<Selector label="Escuela" opciones={OPCIONES} requerido />);
    expect(screen.getByRole("combobox", { name: /Escuela/ })).toHaveAttribute(
      "aria-required",
      "true"
    );
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
  });

  it("vincula el texto de ayuda con aria-describedby", () => {
    render(
      <Selector label="Escuela" opciones={OPCIONES} ayuda="Filtra por escuela" />
    );
    const campo = screen.getByRole("combobox", { name: "Escuela" });
    const ayuda = screen.getByText("Filtra por escuela");
    expect(campo.getAttribute("aria-describedby")).toContain(ayuda.id);
  });

  it("anuncia el error, lo vincula y marca el campo inválido", () => {
    render(<Selector label="Escuela" opciones={OPCIONES} error="Obligatorio" />);
    const campo = screen.getByRole("combobox", { name: "Escuela" });
    const alerta = screen.getByRole("alert");
    expect(alerta).toHaveTextContent("Obligatorio");
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo.getAttribute("aria-describedby")).toContain(alerta.id);
  });

  it("notifica el valor elegido con onChange compatible", async () => {
    const onChange = vi.fn();
    render(
      <Selector
        label="Escuela"
        opciones={OPCIONES}
        value=""
        onChange={onChange}
        placeholder="Seleccione"
      />
    );

    await userEvent.click(screen.getByRole("combobox", { name: "Escuela" }));
    await userEvent.click(await screen.findByRole("option", { name: "Opción B" }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ value: "b" }),
      })
    );
  });

  it("permite opciones con valor vacío (filtros «todas»)", async () => {
    const onChange = vi.fn();
    render(
      <Selector
        label="Escuela"
        opciones={[
          { valor: "", etiqueta: "Todas" },
          ...OPCIONES,
        ]}
        value="a"
        onChange={onChange}
      />
    );

    await userEvent.click(screen.getByRole("combobox", { name: "Escuela" }));
    await userEvent.click(await screen.findByRole("option", { name: "Todas" }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ value: "" }),
      })
    );
  });
});
