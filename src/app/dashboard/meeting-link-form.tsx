"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const DATE_FORMAT = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

// El input datetime-local necesita "YYYY-MM-DDTHH:mm" en hora local.
function toDatetimeLocalValue(date: Date | null) {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function MeetingLinkForm({
  requestId,
  initialUrl,
  initialScheduledAt,
}: {
  requestId: string;
  initialUrl: string | null;
  initialScheduledAt: string | null; // ISO string
}) {
  const router = useRouter();
  const initialDate = initialScheduledAt ? new Date(initialScheduledAt) : null;
  const [url, setUrl] = useState(initialUrl ?? "");
  const [scheduledAt, setScheduledAt] = useState(toDatetimeLocalValue(initialDate));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(!initialUrl);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/tutoring-requests/${requestId}/meeting-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      }),
    });

    setLoading(false);

    if (res.ok) {
      setEditing(false);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No se pudo guardar el link.");
    }
  }

  async function handleRemove() {
    setLoading(true);
    await fetch(`/api/tutoring-requests/${requestId}/meeting-link`, { method: "DELETE" });
    setUrl("");
    setScheduledAt("");
    setLoading(false);
    setEditing(true);
    router.refresh();
  }

  if (!editing && initialUrl) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <a href={initialUrl} target="_blank" rel="noopener noreferrer" className="link-accent">
          Ver link de la clase
        </a>
        {initialDate && (
          <span className="text-secondary capitalize">
            · {DATE_FORMAT.format(initialDate)}hs
          </span>
        )}
        <button onClick={() => setEditing(true)} className="text-secondary hover:text-primary">
          Cambiar
        </button>
        <button onClick={handleRemove} disabled={loading} className="text-secondary hover:text-red-600">
          Quitar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-2">
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://zoom.us/j/... o https://meet.google.com/..."
          className="input text-xs py-1 flex-1 min-w-[220px]"
        />
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="input text-xs py-1"
        />
        <button type="submit" disabled={loading} className="btn-primary text-xs px-2.5 py-1 shrink-0">
          {loading ? "…" : "Guardar link"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
