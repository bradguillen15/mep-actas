import type { MDXComponents } from "mdx/types";
import Link from "next/link";

import { clasificarEnlace } from "@/lib/ayuda/enlaces";

const ESTILO_ENLACE =
  "font-medium text-primario underline underline-offset-2 hover:text-primario-hover";

const componentes: MDXComponents = {
  h1: ({ children }) => (
    <h1 className="mb-4 text-3xl font-bold text-primario">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-8 text-2xl font-semibold text-primario">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-6 text-lg font-semibold text-texto">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-4 leading-relaxed text-texto">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-4 list-disc space-y-1 pl-6 text-texto">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 list-decimal space-y-1 pl-6 text-texto">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href = "", children }) => {
    const clase = clasificarEnlace(href);
    if (clase === "inseguro") return <span>{children}</span>;
    if (clase === "interno") {
      return (
        <Link href={href} className={ESTILO_ENLACE}>
          {children}
        </Link>
      );
    }
    const abreEnPestana = /^https?:/i.test(href.trim());
    return (
      <a
        href={href}
        {...(abreEnPestana && { target: "_blank" })}
        rel="noopener noreferrer"
        className={ESTILO_ENLACE}
      >
        {children}
      </a>
    );
  },
  strong: ({ children }) => <strong className="font-semibold text-texto">{children}</strong>,
  code: ({ children }) => (
    <code className="rounded bg-superficie px-1.5 py-0.5 font-mono text-sm text-texto">
      {children}
    </code>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-4 border-l-4 border-acento bg-superficie px-4 py-2 text-texto">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm text-texto">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-borde bg-superficie px-3 py-2 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border border-borde px-3 py-2">{children}</td>,
};

export function useMDXComponents(): MDXComponents {
  return componentes;
}
