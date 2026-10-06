"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Activa",
  INACTIVE: "Inactiva",
  CANCELED: "Cancelada",
};

export function SubscriptionCard({
  status,
  expiresAt,
}: {
  status: string;
  expiresAt: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function activate() {
    setLoading(true);
    await fetch("/api/tutor/subscription", { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">Suscripción</h2>
        <span className={status === "ACTIVE" ? "badge-success" : "badge-warning"}>
          {STATUS_LABEL[status] ?? status}
        </span>
      </div>
      <p className="text-sm text-secondary mb-3">
        {status === "ACTIVE" && expiresAt
          ? `Tu suscripción está activa hasta el ${new Date(expiresAt).toLocaleDateString("es-AR")}.`
          : "Necesitás una suscripción activa para que los alumnos vean tu perfil."}
      </p>
      {status !== "ACTIVE" && (
        <>
          <button onClick={activate} disabled={loading} className="btn-primary">
            {loading ? "Procesando…" : "Activar suscripción (demo)"}
          </button>
          <p className="text-xs text-secondary mt-2">
            Esto es un stub de demostración: todavía no está conectado a una
            pasarela de pago real.
          </p>
        </>
      )}
    </div>
  );
}
