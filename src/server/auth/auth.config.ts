import NextAuth from "next-auth";
import { config } from "./configuracion";

export const { auth, handlers } = NextAuth(config);
