"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { useSesion } from "@/hooks/useSesion";

export default function IniciarSesion() {
  const router = useRouter();
  const { refrescar } = useSesion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarEnvio = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error === "CredentialsSignin") {
          setError("Credenciales inválidas. Verifique su correo y contraseña.");
          return;
        }

        if (res.error === "Configuration") {
          setError(
            "Error de configuración del servidor. Verifique que la base de datos local esté inicializada (pnpm run dev:local)."
          );
          return;
        }

        try {
          const datos = JSON.parse(res.error) as {
            code?: string;
            retryAfter?: number;
          };
          if (datos.code === "RATE_LIMITED") {
            setError(
              `Demasiados intentos. Intente de nuevo en ${datos.retryAfter} segundos.`
            );
          } else {
            setError("Credenciales inválidas. Verifique su correo y contraseña.");
          }
        } catch {
          setError("No se pudo iniciar sesión. Intente de nuevo.");
        }
        return;
      }

      if (!res?.ok) {
        setError("Credenciales inválidas. Verifique su correo y contraseña.");
        return;
      }

      await refrescar();
      router.push("/consultar");
    } catch {
      setError("Error de conexión. Intente de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-superficie px-4">
      <div className="w-full max-w-sm rounded-xl border border-borde bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-mep.svg"
            alt="Ministerio de Educación Pública — Gobierno de Costa Rica"
            className="h-10 w-auto"
          />
          <h1 className="text-xl font-semibold text-texto">
            Sistema de Consulta de Títulos
          </h1>
        </div>

        <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
          <Campo
            label="Correo electrónico"
            type="email"
            placeholder="correo@mep.go.cr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Campo
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {error && (
            <div className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
              {error}
            </div>
          )}
          <Boton
            type="submit"
            className="w-full"
            cargando={cargando}
            disabled={!email || !password}
          >
            Iniciar sesión
          </Boton>
        </form>
      </div>
    </div>
  );
}
