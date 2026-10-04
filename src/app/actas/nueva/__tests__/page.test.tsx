// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { elegirOpcion } from "../../../../../test/elegir-opcion";
import NuevaActa from "../page";

const { crearActaMock, reemplazarMock, toastExitoMock, escuelaActual } = vi.hoisted(() => ({
  crearActaMock: vi.fn(),
  reemplazarMock: vi.fn(),
  toastExitoMock: vi.fn(),
  escuelaActual: {
    escuelaId: 5 as number | undefined,
    escuelas: [] as { id: number; nombre: string }[],
    puedeElegirEscuela: false,
  },
}));

vi.mock("swr", () => ({
  default: () => ({
    data: [{ id: 1, nombre: "Certificado de Graduación" }],
    error: undefined,
    mutate: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: reemplazarMock, push: vi.fn() }),
}));

vi.mock("@/hooks/useEscuelaActual", () => ({
  useEscuelaActual: () => ({ ...escuelaActual, isLoading: false }),
}));

vi.mock("@/lib/actas-cliente", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("@/lib/actas-cliente")>()),
  crearActa: crearActaMock,
}));

vi.mock("@/components/ui/Notificaciones", () => ({
  toast: { success: toastExitoMock, error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  escuelaActual.escuelaId = 5;
  escuelaActual.escuelas = [];
  escuelaActual.puedeElegirEscuela = false;
  crearActaMock.mockResolvedValue({ id: 42 });
});

async function llenarHastaFolioInicio() {
  await elegirOpcion(/Tipo de acta/, "Certificado de Graduación");
  await userEvent.type(screen.getByLabelText(/Título/), "Acta 001-2025");
  await userEvent.type(screen.getByLabelText(/N° de tomo/), "3");
  await userEvent.type(screen.getByLabelText(/Folio inicio/), "1");
}

async function llenarFolioFin(valor = "8") {
  await userEvent.type(screen.getByLabelText(/Folio fin/), valor);
  await userEvent.tab();
}

describe("Nueva acta", () => {
  it("muestra las dos columnas con el botón de agregar deshabilitado", () => {
    render(<NuevaActa />);

    expect(screen.getByRole("heading", { name: "Datos del acta" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Estudiantes registrados (0)" })).toBeInTheDocument();
    expect(
      screen.getByText("Complete los datos del acta para agregar estudiantes.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Agregar estudiante/ })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Guardar acta" })).not.toBeInTheDocument();
  });

  it("marca como requeridos los campos obligatorios", () => {
    render(<NuevaActa />);

    for (const etiqueta of [/Tipo de acta/, /Título/, /N° de tomo/, /Folio inicio/, /Folio fin/, /Fecha/]) {
      expect(screen.getByLabelText(etiqueta)).toBeRequired();
    }
  });

  it("no envía nada mientras faltan campos requeridos ni muestra errores de campos intactos", async () => {
    render(<NuevaActa />);

    await userEvent.type(screen.getByLabelText(/Título/), "Acta 001-2025");
    await userEvent.tab();

    expect(crearActaMock).not.toHaveBeenCalled();
    expect(screen.queryByText("El tipo es requerido")).not.toBeInTheDocument();
    expect(screen.queryByText("El folio fin es requerido")).not.toBeInTheDocument();
  });

  it("crea el acta una sola vez al completar los campos y redirige a su pantalla", async () => {
    render(<NuevaActa />);

    await llenarHastaFolioInicio();
    expect(crearActaMock).not.toHaveBeenCalled();
    await llenarFolioFin();

    await waitFor(() => expect(crearActaMock).toHaveBeenCalledTimes(1));
    expect(crearActaMock).toHaveBeenCalledWith(
      expect.objectContaining({
        escuelaId: 5,
        tipoActaId: 1,
        titulo: "Acta 001-2025",
        numeroTomo: 3,
        folioInicio: 1,
        folioFin: 8,
      })
    );
    await waitFor(() => expect(reemplazarMock).toHaveBeenCalledWith("/actas/42"));
    expect(toastExitoMock).toHaveBeenCalledWith("Acta creada");
  });

  it("no vuelve a crear el acta mientras la creación está en curso", async () => {
    let resolver: (valor: { id: number }) => void = () => {};
    crearActaMock.mockReturnValue(new Promise((r) => (resolver = r)));
    render(<NuevaActa />);

    await llenarHastaFolioInicio();
    await llenarFolioFin();
    await waitFor(() => expect(crearActaMock).toHaveBeenCalledTimes(1));

    await userEvent.click(screen.getByLabelText(/Título/));
    await userEvent.tab();
    resolver({ id: 42 });
    await waitFor(() => expect(reemplazarMock).toHaveBeenCalledTimes(1));
    await userEvent.click(screen.getByLabelText(/Título/));
    await userEvent.tab();

    expect(crearActaMock).toHaveBeenCalledTimes(1);
  });

  it("rechaza un folio final menor al inicial", async () => {
    render(<NuevaActa />);

    await llenarHastaFolioInicio();
    await llenarFolioFin("0");

    expect(crearActaMock).not.toHaveBeenCalled();
    await userEvent.clear(screen.getByLabelText(/Folio inicio/));
    await userEvent.type(screen.getByLabelText(/Folio inicio/), "10");
    await userEvent.clear(screen.getByLabelText(/Folio fin/));
    await userEvent.type(screen.getByLabelText(/Folio fin/), "8");
    await userEvent.tab();

    expect(
      await screen.findByText("El folio final debe ser mayor o igual al inicial")
    ).toBeInTheDocument();
    expect(crearActaMock).not.toHaveBeenCalled();
  });

  it("exige elegir la escuela cuando la persona puede elegirla", async () => {
    escuelaActual.escuelaId = undefined;
    escuelaActual.puedeElegirEscuela = true;
    escuelaActual.escuelas = [{ id: 7, nombre: "Escuela Central" }];
    render(<NuevaActa />);

    await llenarHastaFolioInicio();
    await llenarFolioFin();
    expect(crearActaMock).not.toHaveBeenCalled();

    await elegirOpcion(/Escuela/, "Escuela Central");

    await waitFor(() => expect(crearActaMock).toHaveBeenCalledTimes(1));
    expect(crearActaMock).toHaveBeenCalledWith(expect.objectContaining({ escuelaId: 7 }));
  });

  it("muestra el error del servidor y no redirige", async () => {
    crearActaMock.mockRejectedValue(new Error("Error al crear acta"));
    render(<NuevaActa />);

    await llenarHastaFolioInicio();
    await llenarFolioFin();

    expect(await screen.findByText("Error al crear acta")).toBeInTheDocument();
    expect(reemplazarMock).not.toHaveBeenCalled();
  });
});
