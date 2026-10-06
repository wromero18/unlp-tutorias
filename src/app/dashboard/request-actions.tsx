"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"ACCEPTED" | "DECLINED" | null>(null);

  async function respond(status: "ACCEPTED" | "DECLINED") {
    setLoading(status);
    await fetch(`/api/tutoring-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => respond("ACCEPTED")}
        disabled={loading !== null}
        className="btn-primary text-xs px-2.5 py-1"
      >
        {loading === "ACCEPTED" ? "…" : "Aceptar"}
      </button>
      <button
        onClick={() => respond("DECLINED")}
        disabled={loading !== null}
        className="btn-secondary text-xs px-2.5 py-1"
      >
        {loading === "DECLINED" ? "…" : "Rechazar"}
      </button>
    </div>
  );
}
