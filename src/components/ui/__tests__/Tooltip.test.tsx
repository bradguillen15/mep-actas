// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../tooltip";

describe("Tooltip", () => {
  it("muestra el contenido al hacer hover sobre el disparador", async () => {
    const usuario = userEvent.setup();
    render(
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button type="button">Acción</button>
        </TooltipTrigger>
        <TooltipContent>Eliminar</TooltipContent>
      </Tooltip>
    );

    await usuario.hover(screen.getByRole("button", { name: "Acción" }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Eliminar");
  });
});
