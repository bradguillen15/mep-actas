import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
        className="mb-3 inline-flex w-fit items-center gap-1 rounded text-sm font-medium text-primario hover:text-primario-hover focus-visible:outline-2 focus-visible:outline-primario"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Volver a Ayuda
      </Link>
      <div className="max-w-3xl rounded-xl border border-borde border-t-4 border-t-acento bg-fondo p-6 shadow-xs sm:p-8">
        <Contenido />
      </div>
    </article>
  );
}
