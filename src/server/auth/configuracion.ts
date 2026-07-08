import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { rateLimiterLogin } from "./rate-limiter";

export const config = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials, _req) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const cabeceras = _req?.headers;
        const ip = cabeceras?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          cabeceras?.get("x-real-ip") ??
          "unknown";

        const { permitido, retryAfter } = rateLimiterLogin(ip);
        if (!permitido) {
          throw new Error(
            JSON.stringify({
              code: "RATE_LIMITED",
              retryAfter: retryAfter ?? 60,
            })
          );
        }

        const { clienteDb } = await import("@/db/cliente");
        const { obtenerUsuarioPorEmail, obtenerAmbitoDeFuncionario } =
          await import("@/server/repositorios/usuarios.repositorio");

        const db = clienteDb();
        const usuario = await obtenerUsuarioPorEmail(db, email);

        if (!usuario || !usuario.activo) return null;

        const passwordValida = await compare(password, usuario.passwordHash);
        if (!passwordValida) return null;

        const ambito = await obtenerAmbitoDeFuncionario(
          db,
          usuario.funcionarioId
        );

        return {
          id: String(usuario.id),
          email: usuario.email,
          rolId: usuario.rolId,
          nivel: usuario.nivel,
          funcionarioId: usuario.funcionarioId,
          usuarioId: usuario.id,
          escuelaId: ambito.escuelaIds[0],
          regionId: ambito.regionIds[0],
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      const tk = token as unknown as Record<string, unknown>;
      if (user) {
        const u = user as unknown as Record<string, unknown>;
        tk.usuarioId = user.id ? Number(user.id) : undefined;
        tk.rolId = u.rolId;
        tk.nivel = u.nivel;
        tk.funcionarioId = u.funcionarioId;
        tk.escuelaId = u.escuelaId;
        tk.regionId = u.regionId;
      }
      return token;
    },
    session({ session, token }) {
      const tk = token as unknown as Record<string, unknown>;
      const usr = session.user as unknown as Record<string, unknown>;
      usr.usuarioId = tk.usuarioId;
      usr.rolId = tk.rolId;
      usr.nivel = tk.nivel;
      usr.funcionarioId = tk.funcionarioId;
      usr.escuelaId = tk.escuelaId;
      usr.regionId = tk.regionId;
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  pages: {
    signIn: "/iniciar-sesion",
  },
  trustHost: true,
} satisfies NextAuthConfig;
