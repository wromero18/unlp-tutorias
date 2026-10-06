"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteMaterialButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    setLoading(true);
    await fetch(`/api/materials/${id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={remove} disabled={loading} className="btn-secondary text-xs px-2.5 py-1">
      {loading ? "…" : "Eliminar"}
    </button>
  );
}
