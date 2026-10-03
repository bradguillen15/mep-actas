"use client";

import { useState } from "react";
import useSWR from "swr";
import type { ColumnDef } from "@tanstack/react-table";
import { KeyRound, Plus, UserCheck, UserX } from "lucide-react";
import {
  Alerta,
  Badge,
  Boton,
  BotonIcono,
  CampoContrasena,
  DialogoConfirmacion,
  EncabezadoPagina,
  EstadoVacio,
  ModalFormulario,
  Tabla,
  toast,
} from "@/components/ui";
import {
  AYUDA_CONTRASENA,
  ModalNuevoUsuario,
} from "@/components/usuarios/ModalNuevoUsuario";
import { useSesion } from "@/hooks/useSesion";
import { useValorRetenido } from "@/hooks/useValorRetenido";
import { obtenerJsonEstricto, patchJson } from "@/lib/api-cliente";

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

interface AccionesUsuarioProps {
  usuario: Usuario;
  esPropio: boolean;
  procesando: boolean;
  conEtiquetas: boolean;
  onRestablecer: (usuario: Usuario) => void;
  onDesactivar: (usuario: Usuario) => void;
  onActivar: (usuario: Usuario) => void;
}

function AccionesUsuario({
  usuario,
  esPropio,
  procesando,
  conEtiquetas,
  onRestablecer,
  onDesactivar,
  onActivar,
}: AccionesUsuarioProps) {
  const etiquetaReset = `Restablecer contraseña de ${usuario.email}`;
  const etiquetaDesactivar = `Desactivar ${usuario.email}`;
  const etiquetaActivar = `Activar ${usuario.email}`;

  if (conEtiquetas) {
    return (
      <div className="flex flex-wrap gap-2">
        <Boton
          variante="secundario"
          tamano="sm"
          aria-label={etiquetaReset}
          onClick={() => onRestablecer(usuario)}
        >
          <KeyRound aria-hidden className="size-4" />
          Contraseña
        </Boton>
        {usuario.activo && !esPropio && (
          <Boton
            variante="secundario"
            tamano="sm"
            aria-label={etiquetaDesactivar}
            cargando={procesando}
            onClick={() => onDesactivar(usuario)}
            className="text-error hover-fino:bg-error/10"
          >
            <UserX aria-hidden className="size-4" />
            Desactivar
          </Boton>
        )}
        {!usuario.activo && (
          <Boton
            variante="secundario"
            tamano="sm"
            aria-label={etiquetaActivar}
            cargando={procesando}
            onClick={() => onActivar(usuario)}
          >
            <UserCheck aria-hidden className="size-4" />
            Activar
          </Boton>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <BotonIcono
        etiqueta={etiquetaReset}
        icono={<KeyRound aria-hidden />}
        onClick={() => onRestablecer(usuario)}
      />
      {usuario.activo && !esPropio && (
        <BotonIcono
          variante="peligro"
          etiqueta={etiquetaDesactivar}
          icono={<UserX aria-hidden />}
          disabled={procesando}
          onClick={() => onDesactivar(usuario)}
        />
      )}
      {!usuario.activo && (
        <BotonIcono
          etiqueta={etiquetaActivar}
          icono={<UserCheck aria-hidden />}
          disabled={procesando}
          onClick={() => onActivar(usuario)}
        />
      )}
    </div>
  );
}

export default function Usuarios() {
  const { usuario: sesion } = useSesion();
  const {
    data: usuarios,
    error: errorUsuarios,
    isLoading,
    mutate,
  } = useSWR<Usuario[]>("/api/usuarios", obtenerJsonEstricto);
  const { data: roles } = useSWR<Rol[]>("/api/roles", obtenerJsonEstricto);
  const { data: funcionarios } = useSWR<Funcionario[]>(
    "/api/funcionarios",
    obtenerJsonEstricto
  );

  const [modalCrear, setModalCrear] = useState(false);
  const [usuarioReset, setUsuarioReset] = useState<Usuario | null>(null);
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [usuarioADesactivar, setUsuarioADesactivar] = useState<Usuario | null>(null);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [errorEstado, setErrorEstado] = useState("");
  const usuarioADesactivarMostrado = useValorRetenido(usuarioADesactivar);
  const usuarioResetMostrado = useValorRetenido(usuarioReset);

  const nivelActor = sesion?.nivel ?? 4;
  const rolesPermitidos = (roles ?? []).filter((r) => r.nivel >= nivelActor);

  const nombreRol = (nivel: number) =>
    (roles ?? []).find((r) => r.nivel === nivel)?.nombre ?? `Nivel ${nivel}`;

  const esPropio = (u: Usuario) => u.id === sesion?.usuarioId;

  const cambiarEstado = async (u: Usuario, activo: boolean) => {
    setErrorEstado("");
    setProcesandoId(u.id);
    try {
      await patchJson(
        `/api/usuarios/${u.id}`,
        { activo },
        "No se pudo cambiar el estado del usuario."
      );
      await mutate();
      toast.success(activo ? "Usuario activado" : "Usuario desactivado");
    } catch (e) {
      setErrorEstado(
        e instanceof Error ? e.message : "Error de conexión."
      );
    } finally {
      setProcesandoId(null);
    }
  };

  const confirmarDesactivacion = async () => {
    if (!usuarioADesactivar) return;
    const objetivo = usuarioADesactivar;
    await cambiarEstado(objetivo, false);
    setUsuarioADesactivar(null);
  };

  const cerrarReset = () => {
    setUsuarioReset(null);
    setNuevaPassword("");
  };

  const restablecerPassword = async () => {
    if (!usuarioReset) return;
    await patchJson(
      `/api/usuarios/${usuarioReset.id}`,
      { password: nuevaPassword },
      "No se pudo restablecer la contraseña."
    );
    cerrarReset();
    toast.success("Contraseña restablecida");
  };

  const accionesDe = (u: Usuario, conEtiquetas: boolean) => (
    <AccionesUsuario
      usuario={u}
      esPropio={esPropio(u)}
      procesando={procesandoId === u.id}
      conEtiquetas={conEtiquetas}
      onRestablecer={setUsuarioReset}
      onDesactivar={setUsuarioADesactivar}
      onActivar={(objetivo) => cambiarEstado(objetivo, true)}
    />
  );

  const badgeEstado = (activo: boolean) =>
    activo ? (
      <Badge variante="exito">Activo</Badge>
    ) : (
      <Badge variante="error">Inactivo</Badge>
    );

  const columnas: ColumnDef<Usuario>[] = [
    { header: "Correo", accessorKey: "email", enableSorting: true },
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
      cell: ({ getValue }) => badgeEstado(getValue() as boolean),
    },
    {
      header: "Acciones",
      enableSorting: false,
      meta: { className: "w-32" },
      cell: ({ row }) => accionesDe(row.original, false),
    },
  ];

  const sinUsuarios = !isLoading && !errorUsuarios && (usuarios?.length ?? 0) === 0;

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPagina
        titulo="Usuarios"
        descripcion="Gestione las cuentas de acceso. Solo puede crear o modificar cuentas de su mismo nivel o inferior, dentro de su ámbito."
        acciones={
          <Boton onClick={() => setModalCrear(true)}>
            <Plus className="h-4 w-4" />
            Nuevo usuario
          </Boton>
        }
      />

      {errorEstado && <Alerta variante="error">{errorEstado}</Alerta>}

      {errorUsuarios && (
        <EstadoVacio
          variante="error"
          mensaje="No se pudieron cargar los usuarios"
          descripcion="Revise su conexión e intente de nuevo."
          accion={
            <Boton variante="secundario" onClick={() => mutate()}>
              Reintentar
            </Boton>
          }
        />
      )}

      {sinUsuarios && (
        <EstadoVacio mensaje="Sin usuarios" descripcion="Aún no hay cuentas registradas." />
      )}

      {isLoading && <Tabla columnas={columnas} datos={[]} cargando />}

      {usuarios && usuarios.length > 0 && (
        <>
          <ul aria-label="Lista de usuarios" className="flex flex-col gap-3 md:hidden">
            {usuarios.map((u) => (
              <li key={u.id} className="rounded-xl border border-borde bg-white p-4">
                <p className="truncate text-sm font-medium text-texto">{u.email}</p>
                <p className="truncate text-sm text-texto-suave">
                  {u.funcionarioNombres} {u.funcionarioApellidos}
                </p>
                <div className="mt-2 flex flex-nowrap items-center gap-2">
                  <Badge variante="info">{nombreRol(u.nivel)}</Badge>
                  {badgeEstado(u.activo)}
                </div>
                <div className="mt-3">{accionesDe(u, true)}</div>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <Tabla columnas={columnas} datos={usuarios} />
          </div>
        </>
      )}

      <ModalNuevoUsuario
        abierto={modalCrear}
        onCerrar={() => setModalCrear(false)}
        onCreado={() => mutate()}
        roles={rolesPermitidos}
        funcionarios={funcionarios ?? []}
      />

      <DialogoConfirmacion
        abierto={usuarioADesactivar !== null}
        onCerrar={() => setUsuarioADesactivar(null)}
        onConfirmar={confirmarDesactivacion}
        titulo="Desactivar usuario"
        descripcion={`${usuarioADesactivarMostrado?.email ?? "El usuario"} no podrá iniciar sesión mientras la cuenta esté desactivada. Puede volver a activarla en cualquier momento.`}
        etiquetaConfirmar="Desactivar"
        variante="peligro"
      />

      <ModalFormulario
        abierto={usuarioReset !== null}
        onCerrar={cerrarReset}
        titulo="Restablecer contraseña"
        textoEnviar="Restablecer"
        deshabilitado={!nuevaPassword}
        onEnviar={restablecerPassword}
      >
        <p className="text-sm text-texto-suave">
          Nueva contraseña para{" "}
          <span className="font-medium text-texto">{usuarioResetMostrado?.email}</span>.
        </p>
        <CampoContrasena
          label="Nueva contraseña"
          requerido
          autoFocus
          ayuda={AYUDA_CONTRASENA}
          value={nuevaPassword}
          onChange={(e) => setNuevaPassword(e.target.value)}
        />
      </ModalFormulario>
    </div>
  );
}
