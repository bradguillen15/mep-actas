// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useValorRetenido } from "../useValorRetenido";

describe("useValorRetenido", () => {
  it("devuelve el valor actual mientras no sea nulo", () => {
    const { result } = renderHook(() => useValorRetenido({ id: 1 }));
    expect(result.current).toEqual({ id: 1 });
  });

  it("retiene el último valor no nulo cuando el valor pasa a null", () => {
    const { result, rerender } = renderHook(
      ({ valor }: { valor: { id: number } | null }) => useValorRetenido(valor),
      { initialProps: { valor: { id: 1 } as { id: number } | null } }
    );
    rerender({ valor: null });
    expect(result.current).toEqual({ id: 1 });
  });

  it("es null si nunca hubo un valor", () => {
    const { result } = renderHook(() => useValorRetenido<string>(null));
    expect(result.current).toBeNull();
  });
});
