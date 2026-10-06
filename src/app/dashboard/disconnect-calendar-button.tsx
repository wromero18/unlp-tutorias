"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DisconnectCalendarButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function disconnect() {
    setLoading(true);
    await fetch("/api/google-calendar/disconnect", { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={disconnect} disabled={loading} className="btn-secondary text-xs px-2.5 py-1">
      {loading ? "Desconectando…" : "Desconectar"}
    </button>
  );
}
