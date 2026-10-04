// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import IniciarSesion from "../page";

const { signInMock, pushMock, refrescarMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
  pushMock: vi.fn(),
  refrescarMock: vi.fn(),
}));

vi.mock("next-auth/react", () => ({ signIn: signInMock }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));
vi.mock("@/hooks/useSesion", () => ({
  useSesion: () => ({ refrescar: refrescarMock }),
}));

beforeEach(() => {
  signInMock.mockReset();
  pushMock.mockReset();
  refrescarMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

async function enviar(correo: string, contrasena: string) {
  await userEvent.type(screen.getByLabelText("Correo electrónico"), correo);
  await userEvent.type(screen.getByLabelText("Contraseña"), contrasena);
  await userEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
}

describe("Iniciar sesión", () => {
  it("enfoca el correo al abrir y usa los autocomplete esperados", () => {
    render(<IniciarSesion />);
    const correo = screen.getByLabelText("Correo electrónico");
    expect(correo).toHaveFocus();
    expect(correo).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute(
      "autocomplete",
      "current-password"
    );
  });

  it("muestra errores de campo al enviar vacío sin llamar a signIn", async () => {
    render(<IniciarSesion />);
    await userEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(screen.getByText("Ingrese su correo electrónico.")).toBeInTheDocument();
    expect(screen.getByText("Ingrese su contraseña.")).toBeInTheDocument();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("no expone el comando de desarrollo en el error de configuración", async () => {
    signInMock.mockResolvedValue({ error: "Configuration" });
    render(<IniciarSesion />);
    await enviar("a@mep.go.cr", "secreto");

    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent(
      "No se pudo conectar con el servicio. Intente de nuevo más tarde."
    );
    expect(alerta).not.toHaveTextContent("db:sembrar");
  });

  it("muestra la pista de desarrollo solo en modo desarrollo", async () => {
    vi.stubEnv("NODE_ENV", "development");
    signInMock.mockResolvedValue({ error: "Configuration" });
    render(<IniciarSesion />);
    await enviar("a@mep.go.cr", "secreto");

    expect(await screen.findByRole("alert")).toHaveTextContent("db:sembrar");
  });

  it("muestra el estado de carga y redirige al iniciar sesión correctamente", async () => {
    signInMock.mockResolvedValue({ ok: true });
    refrescarMock.mockResolvedValue(undefined);
    render(<IniciarSesion />);
    await enviar("a@mep.go.cr", "secreto");

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/consultar"));
  });

  it("informa credenciales inválidas", async () => {
    signInMock.mockResolvedValue({ error: "CredentialsSignin" });
    render(<IniciarSesion />);
    await enviar("a@mep.go.cr", "mala");

    expect(await screen.findByRole("alert")).toHaveTextContent("Credenciales inválidas");
  });
});
