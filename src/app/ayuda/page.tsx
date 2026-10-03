import { redirect } from "next/navigation";
import { BuscadorAyuda } from "@/components/ayuda/BuscadorAyuda";
import { temasAyuda } from "@/contenido/ayuda/temas";
import { temasVisiblesPara } from "@/lib/ayuda/temas";
import { obtenerSesion } from "@/server/auth/sesion.servicio";

export default async function PaginaAyuda() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/iniciar-sesion");

  const temas = temasVisiblesPara(temasAyuda, sesion.nivel);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-texto">Ayuda</h1>
        <p className="mt-1 text-sm text-texto">Manual de usuario</p>
      </header>
      <BuscadorAyuda temas={temas} />
    </div>
  );
}
