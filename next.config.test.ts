import { describe, it, expect } from "vitest";
import nextConfig, { construirScriptSrc } from "./next.config";

describe("next.config", () => {
  it("deshabilita x-powered-by", () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it("agrega cabeceras de seguridad a todas las rutas", async () => {
    const grupos = await nextConfig.headers!();
    expect(grupos).toHaveLength(1);

    const claves = grupos[0].headers.map((h: { key: string }) => h.key);
    expect(claves).toEqual(
      expect.arrayContaining([
        "Strict-Transport-Security",
        "X-Content-Type-Options",
        "X-Frame-Options",
        "Referrer-Policy",
        "Content-Security-Policy",
      ])
    );
  });

  it("la CSP permite scripts inline (requerido por la hidratación RSC de Next.js)", async () => {
    const grupos = await nextConfig.headers!();
    const csp = grupos[0].headers.find(
      (h: { key: string }) => h.key === "Content-Security-Policy"
    )!.value;
    expect(csp).toMatch(/script-src[^;]*'unsafe-inline'/);
  });

  it("permite 'unsafe-eval' solo en desarrollo (Turbopack/HMR)", () => {
    expect(construirScriptSrc("development")).toMatch(/'unsafe-eval'/);
  });

  it("no permite 'unsafe-eval' en producción", () => {
    expect(construirScriptSrc("production")).not.toMatch(/'unsafe-eval'/);
    expect(construirScriptSrc(undefined)).not.toMatch(/'unsafe-eval'/);
  });

  it("permite el dominio de Cloudflare R2 para next/image", () => {
    expect(nextConfig.images?.remotePatterns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          protocol: "https",
          hostname: "*.r2.cloudflarestorage.com",
        }),
      ])
    );
  });
});
