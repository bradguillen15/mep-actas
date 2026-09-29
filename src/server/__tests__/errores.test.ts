import { describe, it, expect } from "vitest";
import { ErrorNoEncontrado, ErrorProhibido } from "../errores";

describe("errores tipados", () => {
  it("ErrorNoEncontrado conserva el nombre que mapean las rutas a 404", () => {
    const error = new ErrorNoEncontrado("Acta no encontrada");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("NotFoundError");
    expect(error.message).toBe("Acta no encontrada");
  });

  it("ErrorProhibido conserva el nombre que mapean las rutas a 403", () => {
    const error = new ErrorProhibido("Sin permisos");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ForbiddenError");
  });
});
