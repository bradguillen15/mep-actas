// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormularioActa } from "../FormularioActa";

const tiposActa = [
  { id: 1, nombre: "Certificado de Graduación" },
  { id: 2, nombre: "Traslado" },
];

function renderizar(
  props: Partial<React.ComponentProps<typeof FormularioActa>> = {}
) {
  const onGuardar = vi.fn().mockResolvedValue(undefined);
  render(
    <FormularioActa
      modo="crear"
      tiposActa={tiposActa}
      escuelas={[]}
      puedeElegirEscuela={false}
      escuelaFijaId={5}
      onGuardar={onGuardar}
      {...props}
    />
  );
  return { onGuardar };
}

async function llenarDatosBasicos(folioFin = "8") {
  await userEvent.selectOptions(screen.getByLabelText(/Tipo de acta/), "1");
  await userEvent.type(screen.getByLabelText(/Título/), "Acta 001-2025");
  await userEvent.type(screen.getByLabelText(/N° de tomo/), "3");
  await userEvent.type(screen.getByLabelText(/Folio inicio/), "1");
  await userEvent.type(screen.getByLabelText(/Folio fin/), folioFin);
}

describe("FormularioActa", () => {
  it("marca como requeridos los campos obligatorios", () => {
    renderizar();

    for (const etiqueta of [/Tipo de acta/, /Título/, /N° de tomo/, /Folio inicio/, /Folio fin/, /Fecha/]) {
      expect(screen.getByLabelText(etiqueta)).toBeRequired();
    }
  });

  it("rechaza un folio final menor al inicial", async () => {
    const { onGuardar } = renderizar();

    await llenarDatosBasicos();
    const folioInicio = screen.getByLabelText(/Folio inicio/);
    await userEvent.clear(folioInicio);
    await userEvent.type(folioInicio, "10");
    await userEvent.click(screen.getByRole("button", { name: "Guardar acta" }));

    expect(
      await screen.findByText("El folio final debe ser mayor o igual al inicial")
    ).toBeInTheDocument();
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it("agrega una fila con foco en la cédula y permite quitarla por su nombre accesible", async () => {
    renderizar();

    await userEvent.click(screen.getByRole("button", { name: /Agregar estudiante/ }));

    const cedula = screen.getByRole("textbox", { name: "Cédula del estudiante 1" });
    expect(cedula).toHaveFocus();

    await userEvent.click(screen.getByRole("button", { name: "Quitar estudiante" }));
    expect(screen.queryByLabelText("Cédula del estudiante 1")).not.toBeInTheDocument();
  });

  it("envía los datos con la misma forma de siempre y la escuela resuelta", async () => {
    const { onGuardar } = renderizar();

    await llenarDatosBasicos();
    await userEvent.click(screen.getByRole("button", { name: /Agregar estudiante/ }));
    await userEvent.type(screen.getByLabelText("Cédula del estudiante 1"), "101110111");
    await userEvent.type(screen.getByLabelText("Nombres del estudiante 1"), "María");
    await userEvent.type(screen.getByLabelText("Apellidos del estudiante 1"), "Pérez");
    await userEvent.type(screen.getByLabelText("N° de certificado del estudiante 1"), "5001");
    await userEvent.click(screen.getByRole("button", { name: "Guardar acta" }));

    await vi.waitFor(() => expect(onGuardar).toHaveBeenCalledTimes(1));
    const [datos, escuelaId] = onGuardar.mock.calls[0];
    expect(escuelaId).toBe(5);
    expect(datos).toMatchObject({
      tipoActaId: "1",
      titulo: "Acta 001-2025",
      numeroTomo: "3",
      folioInicio: "1",
      folioFin: "8",
      actaReferenciaId: "",
      estudiantes: [
        {
          identificacion: "101110111",
          nombres: "María",
          apellidos: "Pérez",
          numeroCertificado: "5001",
        },
      ],
    });
  });

  it("exige elegir la escuela cuando la persona puede elegirla", async () => {
    const { onGuardar } = renderizar({
      puedeElegirEscuela: true,
      escuelaFijaId: undefined,
      escuelas: [{ id: 7, nombre: "Escuela Central" }],
    });

    await llenarDatosBasicos();
    await userEvent.click(screen.getByRole("button", { name: "Guardar acta" }));

    expect(await screen.findByText("La escuela es requerida")).toBeInTheDocument();
    expect(onGuardar).not.toHaveBeenCalled();

    await userEvent.selectOptions(screen.getByLabelText(/Escuela/), "7");
    await userEvent.click(screen.getByRole("button", { name: "Guardar acta" }));
    await vi.waitFor(() => expect(onGuardar).toHaveBeenCalledTimes(1));
    expect(onGuardar.mock.calls[0][1]).toBe(7);
  });

  it("muestra el mensaje de error cuando falla el guardado", async () => {
    const { onGuardar } = renderizar();
    onGuardar.mockRejectedValue(new Error("Error al crear acta"));

    await llenarDatosBasicos();
    await userEvent.click(screen.getByRole("button", { name: "Guardar acta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Error al crear acta");
  });

  it("en modo edición lista los estudiantes registrados y rotula el envío", () => {
    renderizar({
      modo: "editar",
      valoresIniciales: { tipoActaId: "1", titulo: "Acta 7" },
      estudiantesExistentes: [
        {
          id: 1,
          identificacion: "101110111",
          nombres: "María",
          apellidos: "Pérez",
          numeroCertificado: 5001,
        },
      ],
    });

    expect(screen.getByRole("table")).toHaveTextContent("María Pérez");
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute("href", "/actas");
  });
});
