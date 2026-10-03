// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "@/components/layout/Header";
import { EncabezadoShellProvider } from "@/contextos/EncabezadoShellContext";
import Auditoria from "../page";

vi.mock("next/navigation", () => ({ usePathname: () => "/auditoria" }));

function renderizarAuditoria() {
  return render(
    <EncabezadoShellProvider>
      <Header menuAbierto={false} onAbrirMenu={() => {}} />
      <Auditoria />
    </EncabezadoShellProvider>
  );
}

const { sesion, datos } = vi.hoisted(() => ({
  sesion: {
    usuario: { nivel: 1 } as { nivel: number } | null,
    cargando: false,
  },
  datos: { registros: [] as unknown[] },
}));

vi.mock("@/hooks/useSesion", () => ({
  useSesion: () => ({ usuario: sesion.usuario, cargando: sesion.cargando }),
}));

vi.mock("swr", () => ({
  default: () => ({
    data: datos.registros,
    isLoading: false,
    error: undefined,
    mutate: vi.fn(),
  }),
}));

const registro = (sobrescribir: Record<string, unknown> = {}) => ({
  id: 1,
  usuarioId: 1,
  usuarioEmail: "pais@mep.go.cr",
  tabla: "usuarios",
  registroId: 7,
  accion: "actualizar",
  datosAnteriores: JSON.stringify({ nombre: "Ana", activo: true }),
  datosNuevos: JSON.stringify({ nombre: "Ana María", activo: true }),
  createdAt: "2026-03-05T14:30:00.000Z",
  ...sobrescribir,
});

beforeEach(() => {
  sesion.usuario = { nivel: 1 };
  sesion.cargando = false;
  datos.registros = [registro()];
});

describe("Auditoría", () => {
  it("no muestra 'Acceso restringido' mientras la sesión carga", () => {
    sesion.usuario = null;
    sesion.cargando = true;

    render(<Auditoria />);

    expect(screen.queryByText("Acceso restringido")).not.toBeInTheDocument();
  });

  it("muestra 'Acceso restringido' cuando la sesión terminó sin usuario", () => {
    sesion.usuario = null;

    render(<Auditoria />);

    expect(screen.getByText("Acceso restringido")).toBeInTheDocument();
  });

  it.each([1, 2, 3, 4])("muestra la auditoría dentro del ámbito al nivel %i", (nivel) => {
    sesion.usuario = { nivel };

    renderizarAuditoria();

    expect(screen.queryByText("Acceso restringido")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Auditoría" })).toBeInTheDocument();
    expect(screen.getByText("Muestra los cambios registrados dentro de su ámbito.")).toBeInTheDocument();
    expect(screen.getByText("pais@mep.go.cr")).toBeInTheDocument();
  });

  it("muestra la acción y la tabla con etiquetas legibles", () => {
    datos.registros = [registro({ accion: "agregar_estudiante", tabla: "acta_estudiantes" })];

    render(<Auditoria />);

    const fila = screen.getByText("pais@mep.go.cr").closest("tr")!;
    expect(within(fila).getByText("Agregó estudiante")).toBeInTheDocument();
    expect(within(fila).getByText("Estudiantes del acta")).toBeInTheDocument();
  });

  it("no falla al abrir el detalle si los datos no son JSON válido", async () => {
    datos.registros = [registro({ datosAnteriores: "{roto", datosNuevos: null })];

    render(<Auditoria />);
    await userEvent.click(screen.getByText("pais@mep.go.cr"));

    expect(await screen.findByText("{roto")).toBeInTheDocument();
  });

  it("compara campo por campo antes y después", async () => {
    render(<Auditoria />);
    await userEvent.click(screen.getByText("pais@mep.go.cr"));

    const tabla = await screen.findByRole("table", { name: "Comparación de datos" });
    expect(within(tabla).getByText("nombre")).toBeInTheDocument();
    expect(within(tabla).getByText("Ana María")).toBeInTheDocument();
  });

  it("filtra la lista en memoria por acción", async () => {
    datos.registros = [
      registro({ id: 1, usuarioEmail: "a@mep.go.cr", accion: "crear" }),
      registro({ id: 2, usuarioEmail: "b@mep.go.cr", accion: "desactivar" }),
    ];

    render(<Auditoria />);
    await userEvent.selectOptions(screen.getByLabelText("Acción"), "desactivar");

    expect(screen.queryByText("a@mep.go.cr")).not.toBeInTheDocument();
    expect(screen.getByText("b@mep.go.cr")).toBeInTheDocument();
  });
});
