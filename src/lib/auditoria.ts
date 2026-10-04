export type VarianteAccion = "exito" | "error" | "neutro" | "info";

export interface FilaComparacion {
  campo: string;
  antes: string | undefined;
  despues: string | undefined;
  estado: "igual" | "cambiado" | "agregado" | "removido";
}

const ETIQUETAS_ACCION: Record<string, string> = {
  crear: "Creó",
  actualizar: "Actualizó",
  desactivar: "Desactivó",
  activar: "Activó",
  eliminar: "Eliminó",
  subir: "Subió",
  agregar_estudiante: "Agregó estudiante",
  agregar_firmante: "Agregó firmante",
  asignar_escuela: "Asignó escuela",
  remover_escuela: "Removió escuela",
  cambiar_password: "Cambió contraseña",
};

const VARIANTES_ACCION: Record<string, VarianteAccion> = {
  crear: "exito",
  activar: "exito",
  subir: "exito",
  agregar_estudiante: "exito",
  agregar_firmante: "exito",
  asignar_escuela: "exito",
  desactivar: "error",
  eliminar: "error",
  remover_escuela: "error",
  actualizar: "neutro",
  cambiar_password: "neutro",
};

const ETIQUETAS_TABLA: Record<string, string> = {
  actas: "Actas",
  acta_estudiantes: "Estudiantes del acta",
  acta_firmantes: "Firmantes del acta",
  escaneos: "Escaneos",
  escuelas: "Escuelas",
  funcionarios: "Funcionarios",
  funcionario_escuela: "Escuelas del funcionario",
  personas: "Personas",
  regiones: "Regiones",
  tipos_acta: "Tipos de acta",
  usuarios: "Usuarios",
};

const legible = (texto: string) => {
  const limpio = texto.replace(/_/g, " ");
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
};

export const etiquetaAccion = (accion: string) =>
  new Map(Object.entries(ETIQUETAS_ACCION)).get(accion) ?? legible(accion);

export const etiquetaTabla = (tabla: string) =>
  new Map(Object.entries(ETIQUETAS_TABLA)).get(tabla) ?? legible(tabla);

export const varianteAccion = (accion: string): VarianteAccion =>
  new Map(Object.entries(VARIANTES_ACCION)).get(accion) ?? "info";

export function analizarJsonSeguro(texto: string | null): unknown {
  if (texto === null) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
}

export const esObjetoPlano = (valor: unknown): valor is Record<string, unknown> =>
  typeof valor === "object" && valor !== null && !Array.isArray(valor);

const aTexto = (valor: unknown) =>
  typeof valor === "string" ? valor : JSON.stringify(valor);

export function compararDatos(
  anteriores: Record<string, unknown> | null,
  nuevos: Record<string, unknown> | null
): FilaComparacion[] {
  const antes = new Map(Object.entries(anteriores ?? {}));
  const despues = new Map(Object.entries(nuevos ?? {}));
  const campos = [...new Set([...antes.keys(), ...despues.keys()])];

  return campos.map((campo) => {
    const enAntes = antes.has(campo);
    const enDespues = despues.has(campo);
    const textoAntes = enAntes ? aTexto(antes.get(campo)) : undefined;
    const textoDespues = enDespues ? aTexto(despues.get(campo)) : undefined;
    const estado = !enDespues
      ? "removido"
      : !enAntes
        ? "agregado"
        : textoAntes === textoDespues
          ? "igual"
          : "cambiado";
    return { campo, antes: textoAntes, despues: textoDespues, estado };
  });
}
