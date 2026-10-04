// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Providers } from "../Providers";

vi.mock("next/navigation", () => ({ usePathname: () => "/consultar" }));

vi.mock("@/contextos/SesionContext", () => ({
  SesionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSesionContext: () => ({ cargando: false }),
}));

vi.mock("@/hooks/useSesion", () => ({
  useSesion: () => ({
    usuario: { usuarioId: 1, nombre: "Ana Rojas", nivel: 1 },
    cerrarSesion: vi.fn(),
  }),
}));

vi.mock("../../ui/Notificaciones", () => ({ Notificador: () => null }));

describe("Providers (cajón móvil)", () => {
  it("con el cajón abierto, el encabezado y el contenido quedan inertes", async () => {
    render(
      <Providers>
        <p>Contenido</p>
      </Providers>
    );

    const contenido = screen.getByRole("main").parentElement!;
    expect(contenido).not.toHaveAttribute("inert");

    await userEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
    expect(contenido).toHaveAttribute("inert");
  });
});
