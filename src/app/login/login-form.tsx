"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Usuario/email o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Usuario o email</span>
        <input
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="input"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-medium">Contraseña</span>
          <Link href="/forgot-password" className="text-xs link-accent">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary mt-2">
        {loading ? "Ingresando…" : "Ingresar"}
      </button>

      <p className="text-sm text-center text-secondary">
        ¿No tenés cuenta?{" "}
        <Link href="/register" className="link-accent">
          Registrate
        </Link>
      </p>
    </form>
  );
}
