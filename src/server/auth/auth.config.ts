import type { NextAuthConfig } from "next-auth";

export const config = {
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      const tk = token as unknown as Record<string, unknown>;
      if (user) {
        const u = user as unknown as Record<string, unknown>;
        tk.usuarioId = user.id ? Number(user.id) : undefined;
        tk.rolId = u.rolId;
        tk.nivel = u.nivel;
        tk.funcionarioId = u.funcionarioId;
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
      return session;
    },
  },
  pages: {
    signIn: "/iniciar-sesion",
  },
  trustHost: true,
} satisfies NextAuthConfig;
