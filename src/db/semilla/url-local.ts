const URL_LOCAL_PREDETERMINADA = "file:./mep-actas-local.db";

export function resolverUrlLocal(urlConfigurada: string | undefined): string {
  const url = urlConfigurada?.trim() || URL_LOCAL_PREDETERMINADA;

  if (!url.startsWith("file:")) {
    throw new Error(
      `Se rechazó sembrar "${url}": la semilla solo puede ejecutarse contra una base local (file:). Nunca se siembra Turso remoto.`
    );
  }

  return url;
}
