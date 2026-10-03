// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Paginacion } from "../Paginacion";

describe("Paginacion", () => {
  it("permite cambiar cuántos registros se muestran por página", async () => {
    const onLimiteChange = vi.fn();
    render(
      <Paginacion
        pagina={1}
        totalPaginas={3}
        totalRegistros={60}
        limite={20}
        registrosEnPagina={20}
        onChange={vi.fn()}
        onLimiteChange={onLimiteChange}
      />
    );

    const selector = screen.getByRole("combobox", { name: "Registros por página" });
    expect(selector).toHaveValue("20");
    await userEvent.selectOptions(selector, "50");
    expect(onLimiteChange).toHaveBeenCalledWith(50);
  });

  it("no muestra el selector de límite si no hay callback", () => {
    render(
      <Paginacion
        pagina={1}
        totalPaginas={1}
        totalRegistros={10}
        limite={20}
        registrosEnPagina={10}
        onChange={vi.fn()}
      />
    );

    expect(
      screen.queryByRole("combobox", { name: "Registros por página" })
    ).not.toBeInTheDocument();
  });
});
