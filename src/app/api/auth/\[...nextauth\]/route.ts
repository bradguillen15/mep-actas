import NextAuth from "next-auth";
import { config } from "@/server/auth/auth.config";

const { handlers } = NextAuth(config);

export const { GET, POST } = handlers;
