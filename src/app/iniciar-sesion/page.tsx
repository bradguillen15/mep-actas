"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Alerta } from "@/components/ui/Alerta";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { CampoContrasena } from "@/components/ui/CampoContrasena";
import { useSesion } from "@/hooks/useSesion";

const MENSAJE_CREDENCIALES = "Credenciales inválidas. Verifique su correo y contraseña.";
const MENSAJE_SERVICIO =
  "No se pudo conectar con el servicio. Intente de nuevo más tarde.";

function mensajeConfiguracion() {
  if (process.env.NODE_ENV === "development") {
    return `${MENSAJE_SERVICIO} Verifique que la base de datos local esté inicializada (pnpm db:sembrar).`;
  }
  return MENSAJE_SERVICIO;
}

export default function IniciarSesion() {
  const router = useRouter();
  const { refrescar } = useSesion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [errorEmail, setErrorEmail] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarEnvio = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const emailFaltante = email.trim() === "";
    const passwordFaltante = password === "";
    setErrorEmail(emailFaltante ? "Ingrese su correo electrónico." : "");
    setErrorPassword(passwordFaltante ? "Ingrese su contraseña." : "");
    if (emailFaltante || passwordFaltante) return;

    setCargando(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error === "CredentialsSignin") {
          setError(MENSAJE_CREDENCIALES);
          return;
        }

        if (res.error === "Configuration") {
          setError(mensajeConfiguracion());
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
            setError(MENSAJE_CREDENCIALES);
          }
        } catch {
          setError("No se pudo iniciar sesión. Intente de nuevo.");
        }
        return;
      }

      if (!res?.ok) {
        setError(MENSAJE_CREDENCIALES);
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
    <div className="relative flex min-h-dvh items-center justify-center bg-superficie px-4 py-8">
      <div aria-hidden className="absolute inset-x-0 top-0 h-48 bg-primario" />
      <div className="relative w-full max-w-sm animate-in overflow-hidden rounded-2xl border border-borde bg-white shadow-[0_8px_30px_rgb(23_43_84/0.08)] duration-200 fade-in-0 zoom-in-[0.98]">
        <div aria-hidden className="h-[3px] bg-acento" />
        <div className="p-8">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-mep.svg"
              alt="Ministerio de Educación Pública — Gobierno de Costa Rica"
              className="h-10 w-auto"
            />
            <div>
              <h1 className="text-xl font-semibold text-balance text-texto">
                Sistema de Consulta de Títulos
              </h1>
              <p className="mt-1 text-sm text-texto-suave">
                Ingrese con su cuenta institucional
              </p>
            </div>
          </div>

          <form onSubmit={manejarEnvio} noValidate className="flex flex-col gap-4">
            <Campo
              label="Correo electrónico"
              type="email"
              placeholder="correo@mep.go.cr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errorEmail}
              autoFocus
              autoComplete="username"
            />
            <CampoContrasena
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errorPassword}
              autoComplete="current-password"
            />
            {error && <Alerta variante="error">{error}</Alerta>}
            <Boton type="submit" className="w-full" cargando={cargando}>
              {cargando ? "Ingresando…" : "Iniciar sesión"}
            </Boton>
          </form>
        </div>
      </div>
    </div>
  );
}
