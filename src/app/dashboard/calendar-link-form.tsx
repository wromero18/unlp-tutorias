"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarEmbed } from "@/components/calendar-embed";

export function CalendarLinkForm({ initialUrl }: { initialUrl: string | null }) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(!initialUrl);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/tutor/calendar-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
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
    await fetch("/api/tutor/calendar-link", { method: "DELETE" });
    setUrl("");
    setLoading(false);
    setEditing(true);
    router.refresh();
  }

  if (!editing && initialUrl) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-secondary">Tu calendario está anclado acá abajo.</p>
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="btn-secondary text-xs px-2.5 py-1">
              Cambiar link
            </button>
            <button onClick={handleRemove} disabled={loading} className="btn-secondary text-xs px-2.5 py-1">
              Quitar
            </button>
          </div>
        </div>
        <CalendarEmbed url={initialUrl} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <p className="text-sm text-secondary">
        Pegá acá el link público de tu Google Calendar (en Google Calendar:
        Configuración → tu calendario → "Integrar calendario" → "URL pública
        para este calendario").
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://calendar.google.com/calendar/embed?src=..."
          className="input flex-1"
        />
        <button type="submit" disabled={loading} className="btn-primary shrink-0">
          {loading ? "Guardando…" : "Anclar calendario"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
