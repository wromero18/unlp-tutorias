"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Subject = { id: string; name: string };
type Career = { id: string; name: string; subjects: Subject[] };

export function AddSubjectForm({
  careers,
  existingSubjectIds,
}: {
  careers: Career[];
  existingSubjectIds: string[];
}) {
  const router = useRouter();
  const [careerId, setCareerId] = useState(careers[0]?.id ?? "");
  const [subjectId, setSubjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCareer = careers.find((c) => c.id === careerId);
  const availableSubjects =
    selectedCareer?.subjects.filter((s) => !existingSubjectIds.includes(s.id)) ?? [];

  function handleCareerChange(id: string) {
    setCareerId(id);
    setSubjectId("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectId) {
      setError("Elegí una materia.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/tutor/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId }),
    });

    setLoading(false);

    if (res.ok) {
      setSubjectId("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No se pudo agregar la materia.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 items-start">
      <select
        value={careerId}
        onChange={(e) => handleCareerChange(e.target.value)}
        className="input flex-1 w-full sm:w-auto"
      >
        {careers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        value={subjectId}
        onChange={(e) => setSubjectId(e.target.value)}
        className="input flex-1 w-full sm:w-auto"
      >
        <option value="">Elegí una materia…</option>
        {availableSubjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <button type="submit" disabled={loading || !subjectId} className="btn-primary shrink-0">
        {loading ? "Agregando…" : "Agregar materia"}
      </button>

      {error && <p className="text-sm text-red-600 basis-full">{error}</p>}
      {selectedCareer && availableSubjects.length === 0 && !error && (
        <p className="text-sm text-secondary basis-full">
          Ya tenés todas las materias de {selectedCareer.name} agregadas.
        </p>
      )}
    </form>
  );
}
