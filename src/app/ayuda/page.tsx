import { redirect } from "next/navigation";
import { BuscadorAyuda } from "@/components/ayuda/BuscadorAyuda";
import { RegistrarEncabezado } from "@/contextos/EncabezadoShellContext";
import { temasAyuda } from "@/contenido/ayuda/temas";
import { temasVisiblesPara } from "@/lib/ayuda/temas";
import { obtenerSesion } from "@/server/auth/sesion.servicio";

export default async function PaginaAyuda() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/iniciar-sesion");

  const temas = temasVisiblesPara(temasAyuda, sesion.nivel);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
      <RegistrarEncabezado titulo="Ayuda" descripcion="Manual de usuario" />
      <BuscadorAyuda temas={temas} />
    </div>
  );
}
