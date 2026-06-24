import NextAuth from "next-auth";
import { config as authConfig } from "@/server/auth/configuracion";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (!req.auth) {
    const loginUrl = new URL("/iniciar-sesion", req.url);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: [
    "/((?!iniciar-sesion|api/auth|_next/static|_next/image|favicon.ico|icon.svg|logo-mep.svg).*)",
  ],
};
