import { signOut } from "next-auth/react";

export async function cerrarSesion(): Promise<void> {
  await signOut({ callbackUrl: "/iniciar-sesion" });
}
