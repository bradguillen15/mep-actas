// Los nombres se mantienen en inglés porque las rutas mapean por `error.name`.
export class ErrorNoEncontrado extends Error {
  override name = "NotFoundError";
}

export class ErrorProhibido extends Error {
  override name = "ForbiddenError";
}

export class ErrorValidacion extends Error {
  override name = "ValidationError";
}

export class ErrorPersistencia extends Error {
  override name = "PersistenceError";
}
