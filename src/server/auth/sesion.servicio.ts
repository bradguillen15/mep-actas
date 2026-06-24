import NextAuth from "next-auth";
import { config } from "./auth.config";
import type { SesionUsuario } from "./tipos";
import type { NivelRol } from "./tipos";

const { auth } = NextAuth(config);

export async function obtenerSesion(): Promise<SesionUsuario | null> {
  const sesion = await auth();

  if (!sesion?.user) return null;

  const usuario = sesion.user as unknown as Record<string, unknown>;

  return {
    usuarioId: Number(usuario.usuarioId),
    email: String(usuario.email),
    rolId: Number(usuario.rolId),
    nivel: Number(usuario.nivel) as NivelRol,
    funcionarioId: Number(usuario.funcionarioId),
  };
}
