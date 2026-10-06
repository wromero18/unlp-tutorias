"use client";

import { useState } from "react";

export function RequestButton({
  tutorId,
  subjectId,
  initiallyRequested,
}: {
  tutorId: string;
  subjectId: string;
  initiallyRequested: boolean;
}) {
  const [requested, setRequested] = useState(initiallyRequested);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/tutoring-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tutorId, subjectId }),
    });

    setLoading(false);

    if (res.ok) {
      setRequested(true);
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No se pudo enviar la solicitud.");
    }
  }

  if (requested) {
    return <span className="text-xs font-medium text-accent">Solicitud enviada</span>;
  }

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={handleClick}
        disabled={loading}
        className="btn-secondary text-xs px-2.5 py-1"
      >
        {loading ? "Enviando…" : "Solicitar tutoría"}
      </button>
      {error && <span className="text-xs text-red-600 mt-1">{error}</span>}
    </div>
  );
}
