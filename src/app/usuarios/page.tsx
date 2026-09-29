"use client";

import { useReducer, useState } from "react";
import useSWR from "swr";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, KeyRound } from "lucide-react";
import { Tabla } from "@/components/ui/Tabla";
import { Campo } from "@/components/ui/Campo";
import { Selector } from "@/components/ui/Selector";
import { Modal } from "@/components/ui/Modal";
import { Boton } from "@/components/ui/Boton";
import { Cargando } from "@/components/ui/Cargando";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Badge } from "@/components/ui/Badge";
import { useSesion } from "@/hooks/useSesion";

interface Usuario {
  id: number;
  email: string;
  activo: boolean;
  funcionarioId: number;
  rolId: number;
  nivel: number;
  funcionarioNombres: string;
  funcionarioApellidos: string;
  funcionarioPuesto: string;
}

interface Rol {
  id: number;
  nombre: string;
  nivel: number;
}

interface Funcionario {
  id: number;
  nombres: string;
  apellidos: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface FormularioCrear {
  funcionarioId: string;
  rolId: string;
  email: string;
  password: string;
}

type AccionForm =
  | { tipo: "campo"; campo: keyof FormularioCrear; valor: string }
  | { tipo: "reiniciar" };

const formInicial: FormularioCrear = {
  funcionarioId: "",
  rolId: "",
  email: "",
  password: "",
};

function reducerForm(estado: FormularioCrear, accion: AccionForm): FormularioCrear {
  switch (accion.tipo) {
    case "campo":
      return { ...estado, [accion.campo]: accion.valor };
    case "reiniciar":
      return formInicial;
  }
}

export default function Usuarios() {
  const { usuario: sesion } = useSesion();
  const { data: usuarios, isLoading, mutate } = useSWR<Usuario[]>(
    "/api/usuarios",
    fetcher
  );
  const { data: roles } = useSWR<Rol[]>("/api/roles", fetcher);
  const { data: funcionarios } = useSWR<Funcionario[]>(
    "/api/funcionarios",
    fetcher
  );

  const [modalCrear, setModalCrear] = useState(false);
  const [form, dispatch] = useReducer(reducerForm, formInicial);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  const [usuarioReset, setUsuarioReset] = useState<Usuario | null>(null);
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [errorReset, setErrorReset] = useState("");
  const [reseteando, setReseteando] = useState(false);
  const [errorEstado, setErrorEstado] = useState("");

  const nivelActor = sesion?.nivel ?? 4;

  const rolesPermitidos = (roles ?? []).filter((r) => r.nivel >= nivelActor);

  const nombreRol = (nivel: number) =>
    (roles ?? []).find((r) => r.nivel === nivel)?.nombre ?? `Nivel ${nivel}`;

  const manejarCrear = async () => {
    setErrorForm("");
    setGuardando(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funcionarioId: Number(form.funcionarioId),
          rolId: Number(form.rolId),
          email: form.email,
          password: form.password,
        }),
      });
      if (res.status === 403) {
        setErrorForm("No tiene permisos para crear un usuario con ese rol o ámbito.");
        return;
      }
      if (res.status === 409) {
        setErrorForm("El correo ya está registrado.");
        return;
      }
      if (!res.ok) {
        setErrorForm("No se pudo crear el usuario.");
        return;
      }
      dispatch({ tipo: "reiniciar" });
      setModalCrear(false);
      mutate();
    } catch {
      setErrorForm("Error de conexión.");
    } finally {
      setGuardando(false);
    }
  };

  const manejarCambioEstado = async (u: Usuario) => {
    setErrorEstado("");
    try {
      const res = await fetch(`/api/usuarios/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !u.activo }),
      });
      if (res.status === 403) {
        setErrorEstado("No tiene permisos para cambiar el estado de este usuario.");
        return;
      }
      if (!res.ok) {
        setErrorEstado("No se pudo cambiar el estado del usuario.");
        return;
      }
      mutate();
    } catch {
      setErrorEstado("Error de conexión.");
    }
  };

  const manejarReset = async () => {
    if (!usuarioReset) return;
    setErrorReset("");
    setReseteando(true);
    try {
      const res = await fetch(`/api/usuarios/${usuarioReset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: nuevaPassword }),
      });
      if (res.status === 403) {
        setErrorReset("No tiene permisos para restablecer la contraseña de este usuario.");
        return;
      }
      if (!res.ok) {
        setErrorReset("No se pudo restablecer la contraseña.");
        return;
      }
      setUsuarioReset(null);
      setNuevaPassword("");
    } catch {
      setErrorReset("Error de conexión.");
    } finally {
      setReseteando(false);
    }
  };

  const columnas: ColumnDef<Usuario>[] = [
    {
      header: "Correo",
      accessorKey: "email",
      enableSorting: true,
    },
    {
      header: "Funcionario",
      enableSorting: false,
      cell: ({ row }) =>
        `${row.original.funcionarioNombres} ${row.original.funcionarioApellidos}`,
    },
    {
      header: "Rol",
      accessorKey: "nivel",
      enableSorting: true,
      cell: ({ getValue }) => (
        <Badge variante="info">{nombreRol(getValue() as number)}</Badge>
      ),
    },
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
    {
      header: "Acciones",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Boton
            variante="secundario"
            tamano="sm"
            onClick={() => setUsuarioReset(row.original)}
          >
            <KeyRound className="h-4 w-4" />
            Contraseña
          </Boton>
          <Boton
            variante={row.original.activo ? "peligro" : "secundario"}
            tamano="sm"
            onClick={() => manejarCambioEstado(row.original)}
          >
            {row.original.activo ? "Desactivar" : "Activar"}
          </Boton>
        </div>
      ),
    },
  ];

  const formValido =
    form.funcionarioId && form.rolId && form.email && form.password;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-texto">Usuarios</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestione las cuentas de acceso. Solo puede crear o modificar cuentas
            de su mismo nivel o inferior, dentro de su ámbito.
          </p>
        </div>
        <Boton onClick={() => setModalCrear(true)}>
          <Plus className="h-4 w-4" />
          Invitar usuario
        </Boton>
      </div>

      {errorEstado && (
        <div className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
          {errorEstado}
        </div>
      )}

      {isLoading && <Cargando />}

      {!isLoading && (usuarios?.length ?? 0) === 0 && (
        <EstadoVacio mensaje="Sin usuarios" descripcion="Aún no hay cuentas registradas." />
      )}

      {usuarios && usuarios.length > 0 && (
        <>
          <ul aria-label="Lista de usuarios" className="flex flex-col gap-3 md:hidden">
            {usuarios.map((u) => (
              <li
                key={u.id}
                className="rounded-xl border border-borde bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-texto">
                      {u.email}
                    </p>
                    <p className="truncate text-sm text-gray-500">
                      {u.funcionarioNombres} {u.funcionarioApellidos}
                    </p>
                  </div>
                  {u.activo ? (
                    <Badge variante="exito">Activo</Badge>
                  ) : (
                    <Badge variante="error">Inactivo</Badge>
                  )}
                </div>
                <div className="mt-2">
                  <Badge variante="info">{nombreRol(u.nivel)}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Boton
                    variante="secundario"
                    tamano="sm"
                    onClick={() => setUsuarioReset(u)}
                  >
                    <KeyRound className="h-4 w-4" />
                    Contraseña
                  </Boton>
                  <Boton
                    variante={u.activo ? "peligro" : "secundario"}
                    tamano="sm"
                    onClick={() => manejarCambioEstado(u)}
                  >
                    {u.activo ? "Desactivar" : "Activar"}
                  </Boton>
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <Tabla columnas={columnas} datos={usuarios} />
          </div>
        </>
      )}

      <Modal
        abierto={modalCrear}
        onCerrar={() => setModalCrear(false)}
        titulo="Invitar usuario"
        tamano="md"
      >
        <div className="flex flex-col gap-4">
          <Selector
            label="Funcionario"
            placeholder="Seleccione un funcionario"
            opciones={(funcionarios ?? []).map((f) => ({
              valor: f.id,
              etiqueta: `${f.nombres} ${f.apellidos}`,
            }))}
            value={form.funcionarioId}
            onChange={(e) =>
              dispatch({ tipo: "campo", campo: "funcionarioId", valor: e.target.value })
            }
          />
          <Selector
            label="Rol"
            placeholder="Seleccione un rol"
            opciones={rolesPermitidos.map((r) => ({
              valor: r.id,
              etiqueta: r.nombre,
            }))}
            value={form.rolId}
            onChange={(e) =>
              dispatch({ tipo: "campo", campo: "rolId", valor: e.target.value })
            }
          />
          <Campo
            label="Correo electrónico"
            type="email"
            placeholder="correo@mep.go.cr"
            value={form.email}
            onChange={(e) =>
              dispatch({ tipo: "campo", campo: "email", valor: e.target.value })
            }
          />
          <Campo
            label="Contraseña temporal"
            type="password"
            value={form.password}
            onChange={(e) =>
              dispatch({ tipo: "campo", campo: "password", valor: e.target.value })
            }
          />
          {errorForm && (
            <div className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
              {errorForm}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Boton variante="secundario" onClick={() => setModalCrear(false)}>
              Cancelar
            </Boton>
            <Boton
              onClick={manejarCrear}
              cargando={guardando}
              disabled={!formValido}
            >
              Crear
            </Boton>
          </div>
        </div>
      </Modal>

      <Modal
        abierto={usuarioReset !== null}
        onCerrar={() => {
          setUsuarioReset(null);
          setNuevaPassword("");
          setErrorReset("");
        }}
        titulo="Restablecer contraseña"
        tamano="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-500">
            Nueva contraseña para{" "}
            <span className="font-medium text-texto">{usuarioReset?.email}</span>.
          </p>
          <Campo
            label="Nueva contraseña"
            type="password"
            value={nuevaPassword}
            onChange={(e) => setNuevaPassword(e.target.value)}
          />
          {errorReset && (
            <div className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
              {errorReset}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Boton
              variante="secundario"
              onClick={() => {
                setUsuarioReset(null);
                setNuevaPassword("");
              }}
            >
              Cancelar
            </Boton>
            <Boton
              onClick={manejarReset}
              cargando={reseteando}
              disabled={!nuevaPassword}
            >
              Restablecer
            </Boton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
