import createMDX from "@next/mdx";
import type { NextConfig } from "next";

// Next.js App Router necesita 'unsafe-inline' en script-src para el payload
// de hidratación de RSC (sin esto, la app se queda en un spinner infinito).
// 'unsafe-eval' solo se agrega en desarrollo: Turbopack/React DevTools lo
// requieren para HMR y stack traces; React nunca usa eval() en producción.
export function construirScriptSrc(entorno: string | undefined): string {
  return entorno === "development"
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";
}

function construirCabecerasSeguridad() {
  return [
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Content-Security-Policy",
      value: `default-src 'self'; img-src 'self' data: https://*.r2.cloudflarestorage.com; connect-src 'self' https://*.r2.cloudflarestorage.com; ${construirScriptSrc(process.env.NODE_ENV)}; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'`,
    },
  ];
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: construirCabecerasSeguridad() }];
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
