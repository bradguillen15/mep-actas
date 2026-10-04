export const OPCIONES_LIMITE_PAGINA = [20, 50, 100] as const;
export type LimitePagina = (typeof OPCIONES_LIMITE_PAGINA)[number];
export const LIMITE_PAGINA_POR_DEFECTO: LimitePagina = 20;
