"use client";

import { useState } from "react";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setDevResetUrl(null);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (res.ok) {
      setMessage(data?.message ?? "Listo, revisá tu email.");
      if (data?.devResetUrl) setDevResetUrl(data.devResetUrl);
    } else {
      setError(data?.error ?? "No se pudo procesar el pedido.");
    }
  }

  if (message) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-accent">{message}</p>
        {devResetUrl && (
          <div className="card">
            <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">
              Solo en desarrollo (no hay email configurado)
            </p>
            <a href={devResetUrl} className="link-accent text-sm break-all">
              {devResetUrl}
            </a>
          </div>
        )}
        <Link href="/login" className="text-sm text-center link-muted">
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Email</span>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          placeholder="vos@alu.unlp.edu.ar"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary mt-2">
        {loading ? "Enviando…" : "Enviar link"}
      </button>

      <Link href="/login" className="text-sm text-center link-muted">
        Volver a iniciar sesión
      </Link>
    </form>
  );
}
