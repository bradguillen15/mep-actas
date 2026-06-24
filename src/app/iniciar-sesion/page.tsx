"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Boton } from "../../../components/ui/Boton";
import { Campo } from "../../../components/ui/Campo";

export default function IniciarSesion() {
  const router = useRouter();
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
        const datos = JSON.parse(res.error);
        if (datos.code === "RATE_LIMITED") {
          setError(
            `Demasiados intentos. Intente de nuevo en ${datos.retryAfter} segundos.`
          );
        } else {
          setError("Credenciales inválidas. Verifique su correo y contraseña.");
        }
        return;
      }

      if (!res?.ok) {
        setError("Credenciales inválidas. Verifique su correo y contraseña.");
        return;
      }

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
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primario">
            <span className="text-2xl font-bold text-acento">MEP</span>
          </div>
          <h1 className="text-xl font-semibold text-texto">
            Sistema de Consulta de Títulos
          </h1>
          <p className="text-sm text-gray-500">
            Ministerio de Educación Pública
          </p>
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
