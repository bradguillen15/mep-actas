import "next-auth";

declare module "next-auth" {
  interface User {
    usuarioId: number;
    rolId: number;
    nivel: number;
    funcionarioId: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    usuarioId: number;
    rolId: number;
    nivel: number;
    funcionarioId: number;
  }
}
