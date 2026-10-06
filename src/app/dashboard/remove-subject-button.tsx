"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RemoveSubjectButton({ subjectId }: { subjectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    setLoading(true);
    await fetch("/api/tutor/subjects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={remove}
      disabled={loading}
      aria-label="Quitar materia"
      className="text-secondary hover:text-red-600 leading-none"
    >
      ×
    </button>
  );
}
