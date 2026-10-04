import type { AlmacenamientoEscaneos } from "./puerto";
import { crearAlmacenamientoLocal } from "./local";
import { crearAlmacenamientoR2 } from "./r2.adaptador";

type Entorno = Record<string, string | undefined>;

function r2Configurado(entorno: Entorno): boolean {
  return Boolean(
    entorno.R2_ACCOUNT_ID && entorno.R2_ACCESS_KEY_ID && entorno.R2_SECRET_ACCESS_KEY
  );
}

export function modoLocalActivo(entorno: Entorno = process.env): boolean {
  return entorno.NODE_ENV === "development" && !r2Configurado(entorno);
}

export function crearAlmacenamientoEscaneos(
  entorno: Entorno = process.env
): AlmacenamientoEscaneos {
  return modoLocalActivo(entorno) ? crearAlmacenamientoLocal() : crearAlmacenamientoR2();
}
