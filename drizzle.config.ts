import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/esquema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? "",
  },
});
