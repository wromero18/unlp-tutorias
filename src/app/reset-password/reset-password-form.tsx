"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <p className="text-sm text-red-600">
        Este link no es válido. Pedí uno nuevo desde{" "}
        <Link href="/forgot-password" className="link-accent">
          Recuperar contraseña
        </Link>
        .
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    setLoading(false);

    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No se pudo cambiar la contraseña.");
    }
  }

  if (done) {
    return (
      <p className="text-sm text-accent">
        ¡Listo! Tu contraseña se actualizó. Te llevamos a iniciar sesión…
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Nueva contraseña</span>
        <input
          required
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          placeholder="Mínimo 8 caracteres"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Repetí la contraseña</span>
        <input
          required
          type="password"
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="input"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary mt-2">
        {loading ? "Guardando…" : "Guardar nueva contraseña"}
      </button>
    </form>
  );
}
