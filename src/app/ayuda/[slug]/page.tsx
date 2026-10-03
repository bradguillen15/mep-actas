import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cargarContenidoTema } from "@/contenido/ayuda/contenido";
import { temasAyuda } from "@/contenido/ayuda/temas";
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
    <article className="max-w-3xl">
      <Link
        href="/ayuda"
        className="text-sm font-medium text-primario underline underline-offset-2 hover:text-primario-hover"
      >
        Volver a Ayuda
      </Link>
      <h1 className="mb-4 mt-4 text-3xl font-bold text-primario">{tema.titulo}</h1>
      <Contenido />
    </article>
  );
}
