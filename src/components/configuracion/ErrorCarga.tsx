import { Boton, EstadoVacio } from "@/components/ui";

interface ErrorCargaProps {
  mensaje: string;
  onReintentar: () => void;
}

export function ErrorCarga({ mensaje, onReintentar }: ErrorCargaProps) {
  return (
    <EstadoVacio
      variante="error"
      mensaje={mensaje}
      descripcion="Verifique su conexión o sus permisos e intente de nuevo."
      accion={
        <Boton variante="secundario" tamano="sm" onClick={onReintentar}>
          Reintentar
        </Boton>
      }
    />
  );
}
