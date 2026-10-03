// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { ZonaCarga } from "../ZonaCarga";

const crearUrl = vi.fn(() => "blob:previa");
const revocarUrl = vi.fn();

beforeEach(() => {
  crearUrl.mockClear();
  revocarUrl.mockClear();
  URL.createObjectURL = crearUrl;
  URL.revokeObjectURL = revocarUrl;
});

function Envoltorio({ onCambio }: { onCambio?: (a: File | null) => void }) {
  const [archivo, setArchivo] = useState<File | null>(null);
  return (
    <ZonaCarga
      archivo={archivo}
      onArchivo={(a) => {
        setArchivo(a);
        onCambio?.(a);
      }}
      extensionesPermitidas={["jpg", "png", "pdf"]}
      tamanoMaximoMb={1}
    />
  );
}

const imagen = (nombre = "folio.png", tamano = 2048) =>
  new File([new Uint8Array(tamano)], nombre, { type: "image/png" });

describe("ZonaCarga", () => {
  it("acepta un .png aunque el navegador no informe el tipo y muestra la vista previa", () => {
    render(<Envoltorio />);
    fireEvent.change(screen.getByLabelText(/seleccionar/i), {
      target: { files: [new File([new Uint8Array(10)], "folio.png", { type: "" })] },
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByAltText("Vista previa de folio.png")).toBeInTheDocument();
  });

  it("rechaza un .gif por su extensión aunque el tipo parezca imagen", () => {
    render(<Envoltorio />);
    fireEvent.change(screen.getByLabelText(/seleccionar/i), {
      target: { files: [new File(["x"], "animada.gif", { type: "image/gif" })] },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(/tipo de archivo no permitido/i);
    expect(screen.queryByText("animada.gif")).not.toBeInTheDocument();
  });

  it("muestra los tipos aceptados y el tamaño máximo", () => {
    render(<Envoltorio />);
    expect(screen.getByText(/JPG, PNG, PDF/)).toBeInTheDocument();
    expect(screen.getByText(/1 MB/)).toBeInTheDocument();
  });

  it("acepta un archivo válido y muestra nombre, tamaño y vista previa", async () => {
    const onCambio = vi.fn();
    render(<Envoltorio onCambio={onCambio} />);
    await userEvent.upload(screen.getByLabelText(/seleccionar/i), imagen());
    expect(onCambio).toHaveBeenCalled();
    expect(screen.getByText("folio.png")).toBeInTheDocument();
    expect(screen.getByText("2 KB")).toBeInTheDocument();
    expect(screen.getByAltText("Vista previa de folio.png")).toHaveAttribute("src", "blob:previa");
  });

  it("rechaza un tipo no permitido con un mensaje", () => {
    render(<Envoltorio />);
    const entrada = screen.getByLabelText(/seleccionar/i);
    fireEvent.change(entrada, {
      target: { files: [new File(["x"], "nota.txt", { type: "text/plain" })] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/tipo de archivo/i);
    expect(screen.queryByText("nota.txt")).not.toBeInTheDocument();
  });

  it("rechaza un archivo que supera el tamaño máximo", () => {
    render(<Envoltorio />);
    fireEvent.change(screen.getByLabelText(/seleccionar/i), {
      target: { files: [imagen("grande.png", 2 * 1024 * 1024)] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/1 MB/);
  });

  it("quita el archivo y revoca la vista previa", async () => {
    render(<Envoltorio />);
    await userEvent.upload(screen.getByLabelText(/seleccionar/i), imagen());
    await userEvent.click(screen.getByRole("button", { name: "Quitar archivo" }));
    expect(screen.queryByText("folio.png")).not.toBeInTheDocument();
    expect(revocarUrl).toHaveBeenCalledWith("blob:previa");
  });

  it("acepta un archivo soltado y marca el estado de arrastre", () => {
    render(<Envoltorio />);
    const zona = screen.getByTestId("zona-carga");
    fireEvent.dragEnter(zona);
    expect(zona).toHaveClass("border-primario");
    fireEvent.drop(zona, { dataTransfer: { files: [imagen("suelto.png")] } });
    expect(zona).not.toHaveClass("border-primario");
    expect(screen.getByText("suelto.png")).toBeInTheDocument();
  });
});
