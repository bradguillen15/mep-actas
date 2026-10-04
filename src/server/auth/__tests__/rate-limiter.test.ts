import { describe, it, expect, beforeEach } from "vitest";

describe("rateLimiterLogin", () => {
  beforeEach(async () => {
    const { limpiarLimitadores } = await import("../rate-limiter");
    limpiarLimitadores();
  });

  it("permite peticiones dentro del limite", async () => {
    const { rateLimiterLogin } = await import("../rate-limiter");
    for (let i = 0; i < 5; i++) {
      const resultado = rateLimiterLogin("192.168.1.1");
      expect(resultado.permitido).toBe(true);
    }
  });

  it("bloquea despues de exceder el limite", async () => {
    const limite = 5;
    process.env.LOGIN_RATE_LIMIT_MAX = String(limite);

    const { rateLimiterLogin, limpiarLimitadores } = await import(
      "../rate-limiter"
    );
    limpiarLimitadores();

    for (let i = 0; i < limite; i++) {
      rateLimiterLogin("192.168.1.2");
    }

    const resultado = rateLimiterLogin("192.168.1.2");
    expect(resultado.permitido).toBe(false);
    expect(resultado.retryAfter).toBeTypeOf("number");
  });

  it("maneja IPs diferentes de forma independiente", async () => {
    const { rateLimiterLogin } = await import("../rate-limiter");
    for (let i = 0; i < 10; i++) {
      rateLimiterLogin("192.168.1.3");
    }

    const resultado = rateLimiterLogin("192.168.1.4");
    expect(resultado.permitido).toBe(true);
  });
});
