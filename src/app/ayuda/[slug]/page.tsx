import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cargarContenidoTema } from "@/contenido/ayuda/contenido";
import { temasAyuda } from "@/contenido/ayuda/temas";
import { RegistrarEncabezado } from "@/contextos/EncabezadoShellContext";
import { obtenerSesion } from "@/server/auth/sesion.servicio";

interface PaginaTemaAyudaProps {
  params: Promise<{ slug: string }>;
}

export default async function PaginaTemaAyuda({ params }: PaginaTemaAyudaProps) {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/iniciar-sesion");

  const { slug } = await params;
  const tema = temasAyuda.find((candidato) => candidato.slug === slug);
  if (!tema || !tema.niveles.includes(sesion.nivel)) notFound();

  const Contenido = await cargarContenidoTema(tema.slug);
  if (!Contenido) notFound();

  return (
    <article className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <RegistrarEncabezado titulo={tema.titulo} descripcion={tema.descripcion} />
      <Link
        href="/ayuda"
        className="mb-4 text-sm font-medium text-primario underline underline-offset-2 hover:text-primario-hover"
      >
        Volver a Ayuda
      </Link>
      <div className="max-w-3xl">
        <Contenido />
      </div>
    </article>
  );
}
