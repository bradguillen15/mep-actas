// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Tomos from "../page";

const { estado, claveSolicitada } = vi.hoisted(() => ({
  estado: {
    escuelaId: undefined as number | undefined,
    puedeElegirEscuela: false,
    escaneos: [] as unknown[],
    resumenTomos: [] as { numeroTomo: number; cantidadFolios: number }[] | undefined,
  },
  claveSolicitada: { valor: undefined as string | null | undefined },
}));

vi.mock("@/hooks/useEscuelaActual", () => ({
  useEscuelaActual: () => ({
    escuelaId: estado.escuelaId,
    escuelas: [{ id: 5, nombre: "Escuela Central", codigoMep: "001", regionId: 1 }],
    puedeElegirEscuela: estado.puedeElegirEscuela,
  }),
}));

vi.mock("swr", () => ({
  default: (clave: string | null) => {
    if (clave?.startsWith("/api/escaneos/tomos")) {
      return {
        data: estado.resumenTomos,
        isLoading: estado.resumenTomos === undefined,
        error: undefined,
        mutate: vi.fn(),
      };
    }
    claveSolicitada.valor = clave;
    return {
      data: clave ? estado.escaneos : undefined,
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    };
  },
}));

beforeEach(() => {
  estado.escuelaId = undefined;
  estado.puedeElegirEscuela = false;
  estado.escaneos = [];
  estado.resumenTomos = [];
  claveSolicitada.valor = undefined;
  URL.createObjectURL = vi.fn(() => "blob:previa");
  URL.revokeObjectURL = vi.fn();
});

const escaneo = (numeroFolio: number, numeroTomo = 12) => ({
  id: numeroFolio,
  escuelaId: 5,
  numeroTomo,
  numeroFolio,
  url: `k${numeroFolio}`,
  urlLectura: `/img/${numeroFolio}.png`,
  formato: "png",
  createdAt: "2026-01-01T00:00:00.000Z",
});

describe("Tomos — selección de escuela", () => {
  it("pide seleccionar una escuela y no consulta folios cuando Admin País no ha elegido ninguna", () => {
    estado.puedeElegirEscuela = true;
    estado.resumenTomos = undefined;

    render(<Tomos />);

    expect(screen.getByText("Seleccione una escuela")).toBeInTheDocument();
    expect(claveSolicitada.valor).toBeNull();
  });

  it("muestra los tomos disponibles y abre el primero automáticamente", async () => {
    estado.escuelaId = 5;
    estado.resumenTomos = [
      { numeroTomo: 12, cantidadFolios: 18 },
      { numeroTomo: 14, cantidadFolios: 15 },
    ];
    estado.escaneos = [escaneo(1), escaneo(2)];

    render(<Tomos />);

    expect(screen.getByRole("group", { name: "Tomos disponibles" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tomo 12/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: /Tomo 14/ })).toHaveAttribute(
      "aria-pressed",
      "false"
    );

    await waitFor(() => {
      expect(claveSolicitada.valor).toBe("/api/escaneos?escuelaId=5&tomo=12");
    });
  });

  it("al cambiar de tomo consulta los folios de ese tomo", async () => {
    estado.escuelaId = 5;
    estado.resumenTomos = [
      { numeroTomo: 12, cantidadFolios: 18 },
      { numeroTomo: 14, cantidadFolios: 15 },
    ];
    estado.escaneos = [escaneo(1)];

    render(<Tomos />);

    fireEvent.click(screen.getByRole("button", { name: /Tomo 14/ }));

    await waitFor(() => {
      expect(claveSolicitada.valor).toBe("/api/escaneos?escuelaId=5&tomo=14");
    });
    expect(screen.getByRole("button", { name: /Tomo 14/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("si la escuela no tiene tomos, muestra vacío sin consultar un tomo inventado", () => {
    estado.escuelaId = 5;
    estado.resumenTomos = [];

    render(<Tomos />);

    expect(screen.getByText("Sin tomos digitalizados")).toBeInTheDocument();
    expect(claveSolicitada.valor).toBeNull();
  });
});

describe("Tomos — visor de folios", () => {
  it("no muta el arreglo de datos de SWR al ordenar", () => {
    estado.escuelaId = 5;
    estado.resumenTomos = [{ numeroTomo: 12, cantidadFolios: 3 }];
    const datos = [escaneo(3), escaneo(1), escaneo(2)];
    estado.escaneos = datos;

    render(<Tomos />);

    expect(datos.map((e) => e.numeroFolio)).toEqual([3, 1, 2]);
    expect(screen.getByText("Folio 1 de 3")).toBeInTheDocument();
  });

  it("navega entre folios con los botones y con las flechas del teclado", () => {
    estado.escuelaId = 5;
    estado.resumenTomos = [{ numeroTomo: 12, cantidadFolios: 3 }];
    estado.escaneos = [escaneo(1), escaneo(2), escaneo(3)];

    render(<Tomos />);

    fireEvent.click(screen.getByRole("button", { name: "Folio siguiente" }));
    expect(screen.getByText("Folio 2 de 3")).toBeInTheDocument();

    const visor = screen.getByRole("group", { name: "Visor de folios" });
    fireEvent.keyDown(visor, { key: "ArrowRight" });
    expect(screen.getByText("Folio 3 de 3")).toBeInTheDocument();
    fireEvent.keyDown(visor, { key: "ArrowLeft" });
    expect(screen.getByText("Folio 2 de 3")).toBeInTheDocument();
  });

  it("abre el folio en pantalla completa, navega con las flechas y sincroniza el visor al cerrar", async () => {
    estado.escuelaId = 5;
    estado.resumenTomos = [{ numeroTomo: 12, cantidadFolios: 3 }];
    estado.escaneos = [escaneo(1), escaneo(2), escaneo(3)];

    render(<Tomos />);

    await userEvent.click(screen.getByRole("button", { name: "Ver en pantalla completa" }));
    const dialogo = screen.getByRole("dialog", { name: "Tomo 12 · Folio 1" });

    fireEvent.keyDown(dialogo, { key: "ArrowRight" });
    expect(screen.getByRole("dialog", { name: "Tomo 12 · Folio 2" })).toBeInTheDocument();

    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Cerrar pantalla completa" })
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Folio 2 de 3")).toBeInTheDocument();
  });

  it("muestra la escuela como contexto y no duplica el selector en el formulario de subida", () => {
    estado.puedeElegirEscuela = true;
    estado.resumenTomos = undefined;

    render(<Tomos />);

    expect(screen.getAllByLabelText("Escuela")).toHaveLength(1);
  });
});

describe("Tomos — modal Nuevo folio", () => {
  const escuelaConFolios = () => {
    estado.escuelaId = 5;
    estado.resumenTomos = [{ numeroTomo: 12, cantidadFolios: 1 }];
    estado.escaneos = [escaneo(1)];
  };

  async function abrirModal() {
    await userEvent.click(screen.getByRole("button", { name: /Nuevo folio/ }));
    return screen.findByRole("dialog");
  }

  async function llenarModal(dialogo: HTMLElement, archivo: File) {
    await userEvent.type(within(dialogo).getByLabelText("N° de tomo"), "12");
    await userEvent.type(within(dialogo).getByLabelText("N° de folio"), "2");
    await userEvent.upload(
      within(dialogo).getByTestId("zona-carga").querySelector("input[type=file]") as HTMLInputElement,
      archivo
    );
  }

  it("no muestra el bloque de subida en línea y abre el modal con el botón", async () => {
    escuelaConFolios();
    render(<Tomos />);

    expect(screen.queryByText("Subir nuevo folio")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("N° de tomo")).not.toBeInTheDocument();

    const dialogo = await abrirModal();

    expect(within(dialogo).getByLabelText("N° de tomo")).toBeInTheDocument();
    expect(within(dialogo).getByLabelText("N° de folio")).toBeInTheDocument();
    expect(within(dialogo).getByText("Escuela: Escuela Central")).toBeInTheDocument();
  });

  it("deshabilita Nuevo folio mientras no hay escuela seleccionada", () => {
    estado.puedeElegirEscuela = true;
    estado.resumenTomos = undefined;
    render(<Tomos />);

    expect(screen.getByRole("button", { name: /Nuevo folio/ })).toBeDisabled();
  });

  it("deshabilita Subir folio hasta completar tomo, folio y archivo", async () => {
    escuelaConFolios();
    render(<Tomos />);
    const dialogo = await abrirModal();

    expect(within(dialogo).getByRole("button", { name: "Subir folio" })).toBeDisabled();

    await llenarModal(dialogo, new File(["x"], "folio.png", { type: "image/png" }));

    expect(within(dialogo).getByRole("button", { name: "Subir folio" })).toBeEnabled();
  });

  it("prepara la subida, envía el archivo y cierra el modal", async () => {
    escuelaConFolios();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ urlSubida: "https://r2.test/subida" }),
      })
      .mockResolvedValueOnce({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    render(<Tomos />);
    const dialogo = await abrirModal();

    await llenarModal(dialogo, new File(["x"], "folio.png", { type: "image/png" }));
    await userEvent.click(within(dialogo).getByRole("button", { name: "Subir folio" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/escaneos",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ escuelaId: 5, numeroTomo: 12, numeroFolio: 2, formato: "png" }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://r2.test/subida",
      expect.objectContaining({ method: "PUT" })
    );
    vi.unstubAllGlobals();
  });

  it("muestra el error de la preparación dentro del modal y lo deja abierto", async () => {
    escuelaConFolios();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "El folio ya existe" }),
      })
    );
    render(<Tomos />);
    const dialogo = await abrirModal();

    await llenarModal(dialogo, new File(["x"], "folio.png", { type: "image/png" }));
    await userEvent.click(within(dialogo).getByRole("button", { name: "Subir folio" }));

    expect(await within(dialogo).findByText("El folio ya existe")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
