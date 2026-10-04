// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DetalleActa } from "../DetalleActa";
import type { ActaDetallada } from "../tipos";

const { patchJsonMock, agregarEstudiantesMock, toastExitoMock } = vi.hoisted(() => ({
  patchJsonMock: vi.fn(),
  agregarEstudiantesMock: vi.fn(),
  toastExitoMock: vi.fn(),
}));

vi.mock("@/lib/api-cliente", () => ({ patchJson: patchJsonMock }));

vi.mock("@/lib/actas-cliente", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("@/lib/actas-cliente")>()),
  agregarEstudiantesAlActa: agregarEstudiantesMock,
}));

vi.mock("@/components/ui/Notificaciones", () => ({
  toast: { success: toastExitoMock, error: vi.fn() },
}));

const acta: ActaDetallada = {
  id: 7,
  escuelaId: 5,
  tipoActaId: 1,
  titulo: "Acta 7",
  numeroTomo: 3,
  folioInicio: 2,
  folioFin: 8,
  fecha: "2024-12-10T00:00:00.000Z",
  actaReferenciaId: null,
};

const estudiantes = [
  {
    id: 1,
    identificacion: "101110111",
    nombres: "María",
    apellidos: "Pérez",
    numeroCertificado: 5001,
  },
];

const onActualizado = vi.fn();

function renderizar() {
  render(
    <DetalleActa
      acta={acta}
      estudiantes={estudiantes}
      tiposActa={[{ id: 1, nombre: "Certificado de Graduación" }]}
      escuelas={[]}
      puedeElegirEscuela={false}
      onActualizado={onActualizado}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  patchJsonMock.mockResolvedValue(undefined);
  agregarEstudiantesMock.mockResolvedValue(undefined);
  onActualizado.mockResolvedValue(undefined);
});

describe("DetalleActa", () => {
  it("muestra los campos editables, los estudiantes y el botón de agregar al cargar", () => {
    renderizar();

    expect(screen.getByRole("heading", { name: "Estudiantes registrados (1)" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toHaveTextContent("María Pérez");
    expect(screen.getByLabelText(/Título/)).toHaveValue("Acta 7");
    expect(screen.getByLabelText(/Folio fin/)).toHaveValue(8);
    expect(screen.getByRole("button", { name: /Agregar estudiante/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar cambios" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Cancelar" })).not.toBeInTheDocument();
  });

  it("indica cuando el acta no tiene estudiantes", () => {
    render(
      <DetalleActa
        acta={acta}
        estudiantes={[]}
        tiposActa={[]}
        escuelas={[]}
        puedeElegirEscuela={false}
        onActualizado={onActualizado}
      />
    );

    expect(screen.getByText("Sin estudiantes asociados a esta acta.")).toBeInTheDocument();
  });

  it("guarda al salir del campo cuando cambió y es válido", async () => {
    renderizar();

    const titulo = screen.getByLabelText(/Título/);
    await userEvent.clear(titulo);
    await userEvent.type(titulo, "Acta 7 corregida");
    await userEvent.tab();

    await waitFor(() => expect(patchJsonMock).toHaveBeenCalledTimes(1));
    expect(patchJsonMock).toHaveBeenCalledWith(
      "/api/actas/7",
      expect.objectContaining({
        escuelaId: 5,
        tipoActaId: 1,
        titulo: "Acta 7 corregida",
        numeroTomo: 3,
        folioInicio: 2,
        folioFin: 8,
        actaReferenciaId: null,
      }),
      expect.any(String)
    );
    expect(await screen.findByText("Cambios guardados")).toBeInTheDocument();
    expect(onActualizado).toHaveBeenCalled();
  });

  it("no guarda si el valor no cambió", async () => {
    renderizar();

    await userEvent.click(screen.getByLabelText(/Título/));
    await userEvent.tab();

    expect(patchJsonMock).not.toHaveBeenCalled();
  });

  it("no vuelve a guardar un valor ya guardado", async () => {
    renderizar();

    const titulo = screen.getByLabelText(/Título/);
    await userEvent.type(titulo, "!");
    await userEvent.tab();
    await screen.findByText("Cambios guardados");
    await userEvent.click(titulo);
    await userEvent.tab();

    expect(patchJsonMock).toHaveBeenCalledTimes(1);
  });

  it("no guarda un folio final menor al inicial y muestra el error", async () => {
    renderizar();

    const folioFin = screen.getByLabelText(/Folio fin/);
    await userEvent.clear(folioFin);
    await userEvent.type(folioFin, "1");
    await userEvent.tab();

    expect(
      await screen.findByText("El folio final debe ser mayor o igual al inicial")
    ).toBeInTheDocument();
    expect(patchJsonMock).not.toHaveBeenCalled();
  });

  it("no guarda un título vacío", async () => {
    renderizar();

    await userEvent.clear(screen.getByLabelText(/Título/));
    await userEvent.tab();

    expect(await screen.findByText("El título es requerido")).toBeInTheDocument();
    expect(patchJsonMock).not.toHaveBeenCalled();
  });

  it("muestra el mensaje del servidor cuando falla el guardado", async () => {
    patchJsonMock.mockRejectedValue(new Error("No tiene permisos para realizar esta acción"));
    renderizar();

    await userEvent.type(screen.getByLabelText(/Título/), "!");
    await userEvent.tab();

    expect(
      await screen.findByText("No tiene permisos para realizar esta acción")
    ).toBeInTheDocument();
    expect(onActualizado).not.toHaveBeenCalled();
  });
});

describe("DetalleActa: modal Agregar estudiante", () => {
  async function abrirModal() {
    await userEvent.click(screen.getByRole("button", { name: /Agregar estudiante/ }));
    return screen.findByRole("dialog");
  }

  it("agrega un estudiante, refresca y cierra el modal", async () => {
    renderizar();
    const dialogo = await abrirModal();

    await userEvent.type(within(dialogo).getByLabelText(/Cédula/), "202220222");
    await userEvent.type(within(dialogo).getByLabelText(/Nombres/), "Luis");
    await userEvent.type(within(dialogo).getByLabelText(/Apellidos/), "Mora");
    await userEvent.type(within(dialogo).getByLabelText(/N° certificado/), "5002");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Agregar" }));

    await waitFor(() => expect(agregarEstudiantesMock).toHaveBeenCalledTimes(1));
    expect(agregarEstudiantesMock).toHaveBeenCalledWith(7, [
      {
        identificacion: "202220222",
        nombres: "Luis",
        apellidos: "Mora",
        numeroCertificado: "5002",
      },
    ]);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onActualizado).toHaveBeenCalled();
    expect(toastExitoMock).toHaveBeenCalledWith("Estudiante agregado");
  });

  it("exige todos los campos antes de enviar", async () => {
    renderizar();
    const dialogo = await abrirModal();

    await userEvent.click(within(dialogo).getByRole("button", { name: "Agregar" }));

    expect(await within(dialogo).findAllByText("Requerido")).toHaveLength(4);
    expect(agregarEstudiantesMock).not.toHaveBeenCalled();
  });

  it("muestra el error del servidor dentro del modal y lo deja abierto", async () => {
    agregarEstudiantesMock.mockRejectedValue(new Error("Número de certificado duplicado"));
    renderizar();
    const dialogo = await abrirModal();

    await userEvent.type(within(dialogo).getByLabelText(/Cédula/), "202220222");
    await userEvent.type(within(dialogo).getByLabelText(/Nombres/), "Luis");
    await userEvent.type(within(dialogo).getByLabelText(/Apellidos/), "Mora");
    await userEvent.type(within(dialogo).getByLabelText(/N° certificado/), "5001");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Agregar" }));

    expect(await within(dialogo).findByText("Número de certificado duplicado")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(onActualizado).not.toHaveBeenCalled();
  });

  it("al reabrir el modal los campos están vacíos", async () => {
    renderizar();
    let dialogo = await abrirModal();
    await userEvent.type(within(dialogo).getByLabelText(/Cédula/), "202220222");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    dialogo = await abrirModal();

    expect(within(dialogo).getByLabelText(/Cédula/)).toHaveValue("");
  });
});
