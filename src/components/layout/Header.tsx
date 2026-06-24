export function Header() {
  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-center border-b border-borde bg-white px-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-mep.svg"
        alt="Ministerio de Educación Pública — Gobierno de Costa Rica"
        className="h-8 w-auto"
      />
    </header>
  );
}
