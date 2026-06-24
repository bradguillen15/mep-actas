"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, UserCog } from "lucide-react";
import { Tabla } from "../../../components/ui/Tabla";
import { Boton } from "../../../components/ui/Boton";
import { Campo } from "../../../components/ui/Campo";
import { Selector } from "../../../components/ui/Selector";
import { Modal } from "../../../components/ui/Modal";
import { Cargando } from "../../../components/ui/Cargando";
import { Badge } from "../../../components/ui/Badge";
import { Tarjeta } from "../../../components/ui/Tarjeta";

type Pestana = "usuarios" | "tipos-acta" | "catalogo";

const pestanas: { id: Pestana; etiqueta: string }[] = [
  { id: "usuarios", etiqueta: "Usuarios" },
  { id: "tipos-acta", etiqueta: "Tipos de acta" },
  { id: "catalogo", etiqueta: "Catálogos" },
];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  nivel: number;
  escuela: string;
  activo: boolean;
}

interface TipoActa {
  id: number;
  nombre: string;
}

interface Region {
  id: number;
  nombre: string;
  activo: boolean;
}

interface Escuela {
  id: number;
  nombre: string;
  codigoMep: string;
  regionId: number;
  activo: boolean;
}

export default function Configuracion() {
  const [pestanaActiva, setPestanaActiva] = useState<Pestana>("usuarios");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-texto">Configuración</h1>
        <p className="mt-1 text-sm text-gray-500">
          Administración del sistema.
        </p>
      </div>

      <div className="flex gap-1 rounded-lg bg-superficie p-1 border border-borde w-fit">
        {pestanas.map((p) => (
          <button
            key={p.id}
            onClick={() => setPestanaActiva(p.id)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              pestanaActiva === p.id
                ? "bg-white text-texto shadow-sm"
                : "text-gray-500 hover:text-texto"
            }`}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>

      {pestanaActiva === "usuarios" && <GestionUsuarios />}
      {pestanaActiva === "tipos-acta" && <GestionTiposActa />}
      {pestanaActiva === "catalogo" && <GestionCatalogos />}
    </div>
  );
}

function GestionUsuarios() {
  const { data: usuarios, isLoading } = useSWR<Usuario[]>("/api/usuarios", fetcher);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevoPassword, setNuevoPassword] = useState("");
  const [error, setError] = useState("");
  const [creando, setCreando] = useState(false);

  const columnas: ColumnDef<Usuario>[] = [
    { header: "Email", accessorKey: "email", enableSorting: true },
    { header: "Rol", accessorKey: "rol", enableSorting: true },
    {
      header: "Estado",
      accessorKey: "activo",
      enableSorting: true,
      cell: ({ getValue }) =>
        getValue() ? (
          <Badge variante="exito">Activo</Badge>
        ) : (
          <Badge variante="error">Inactivo</Badge>
        ),
    },
  ];

  const crearUsuario = async () => {
    setError("");
    setCreando(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nuevoEmail, password: nuevoPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error al crear usuario" }));
        throw new Error(err.error ?? "Error al crear usuario");
      }
      setModalAbierto(false);
      setNuevoEmail("");
      setNuevoPassword("");
      mutate("/api/usuarios");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear usuario");
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {usuarios?.length ?? 0} usuario{(usuarios?.length ?? 0) !== 1 ? "s" : ""}
        </p>
        <Boton tamano="sm" onClick={() => setModalAbierto(true)}>
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </Boton>
      </div>
      {isLoading && <Cargando />}
      {usuarios && <Tabla columnas={columnas} datos={usuarios} />}

      <Modal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        titulo="Nuevo usuario"
      >
        <div className="flex flex-col gap-4">
          <Campo
            label="Correo electrónico"
            type="email"
            value={nuevoEmail}
            onChange={(e) => setNuevoEmail(e.target.value)}
          />
          <Campo
            label="Contraseña"
            type="password"
            value={nuevoPassword}
            onChange={(e) => setNuevoPassword(e.target.value)}
          />
          {error && (
            <div className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
              {error}
            </div>
          )}
          <Boton onClick={crearUsuario} cargando={creando}>
            Crear usuario
          </Boton>
        </div>
      </Modal>
    </div>
  );
}

function GestionTiposActa() {
  const { data: tipos, isLoading, mutate: refreshTipos } = useSWR<TipoActa[]>(
    "/api/tipos-acta",
    fetcher
  );
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [creando, setCreando] = useState(false);

  const agregarTipo = async () => {
    if (!nuevoNombre.trim()) return;
    setCreando(true);
    try {
      await fetch("/api/tipos-acta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevoNombre.trim() }),
      });
      setNuevoNombre("");
      refreshTipos();
    } finally {
      setCreando(false);
    }
  };

  const columnas: ColumnDef<TipoActa>[] = [
    { header: "ID", accessorKey: "id" },
    { header: "Nombre", accessorKey: "nombre", enableSorting: true },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Campo
          placeholder="Nuevo tipo de acta"
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          className="max-w-xs"
        />
        <Boton
          tamano="sm"
          onClick={agregarTipo}
          disabled={!nuevoNombre.trim()}
          cargando={creando}
        >
          <Plus className="h-4 w-4" />
          Agregar
        </Boton>
      </div>
      {isLoading && <Cargando />}
      {tipos && <Tabla columnas={columnas} datos={tipos} />}
    </div>
  );
}

function GestionCatalogos() {
  return (
    <div className="flex flex-col gap-6">
      <Tarjeta>
        <h3 className="text-sm font-semibold text-texto mb-3">Regiones</h3>
        <RegionesLista />
      </Tarjeta>
      <Tarjeta>
        <h3 className="text-sm font-semibold text-texto mb-3">Escuelas</h3>
        <EscuelasLista />
      </Tarjeta>
    </div>
  );
}

function RegionesLista() {
  const { data: regiones, isLoading } = useSWR<Region[]>("/api/regiones", fetcher);

  if (isLoading) return <Cargando />;

  const columnas: ColumnDef<Region>[] = [
    { header: "ID", accessorKey: "id" },
    { header: "Nombre", accessorKey: "nombre", enableSorting: true },
    {
      header: "Estado",
      accessorKey: "activo",
      cell: ({ getValue }) =>
        getValue() ? <Badge variante="exito">Activa</Badge> : <Badge variante="error">Inactiva</Badge>,
    },
  ];

  return <Tabla columnas={columnas} datos={regiones ?? []} />;
}

function EscuelasLista() {
  const { data: escuelas, isLoading } = useSWR<Escuela[]>("/api/escuelas", fetcher);

  if (isLoading) return <Cargando />;

  const columnas: ColumnDef<Escuela>[] = [
    { header: "ID", accessorKey: "id" },
    { header: "Nombre", accessorKey: "nombre", enableSorting: true },
    { header: "Código MEP", accessorKey: "codigoMep" },
    { header: "Región ID", accessorKey: "regionId" },
    {
      header: "Estado",
      accessorKey: "activo",
      cell: ({ getValue }) =>
        getValue() ? <Badge variante="exito">Activa</Badge> : <Badge variante="error">Inactiva</Badge>,
    },
  ];

  return <Tabla columnas={columnas} datos={escuelas ?? []} />;
}
