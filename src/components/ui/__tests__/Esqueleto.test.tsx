// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Esqueleto, FilasEsqueleto } from "../Esqueleto";

describe("Esqueleto", () => {
  it("se oculta a los lectores de pantalla", () => {
    const { container } = render(<Esqueleto className="h-4" />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("FilasEsqueleto genera filas por columnas", () => {
    const { container } = render(
      <table>
        <tbody>
          <FilasEsqueleto filas={3} columnas={4} />
        </tbody>
      </table>
    );
    expect(container.querySelectorAll("tr")).toHaveLength(3);
    expect(container.querySelectorAll("td")).toHaveLength(12);
  });
});
