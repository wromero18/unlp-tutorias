"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Subject = { id: string; name: string };
type Student = { id: string; name: string };

export function AddMaterialForm({
  subjects,
  students,
}: {
  subjects: Subject[];
  students: Student[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [kind, setKind] = useState<"PDF" | "ACTIVITY">("PDF");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("kind", kind);

    const res = await fetch("/api/materials", { method: "POST", body: formData });

    setLoading(false);

    if (res.ok) {
      formRef.current?.reset();
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No se pudo agregar el material.");
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setKind("PDF")}
          className={kind === "PDF" ? "pill-active" : "pill"}
        >
          PDF
        </button>
        <button
          type="button"
          onClick={() => setKind("ACTIVITY")}
          className={kind === "ACTIVITY" ? "pill-active" : "pill"}
        >
          Actividad
        </button>
      </div>

      <input
        name="title"
        required
        placeholder="Título"
        className="input"
      />

      <select name="studentId" defaultValue="" className="input">
        <option value="">Todos mis alumnos</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <select name="subjectId" defaultValue="" className="input">
        <option value="">Materia (opcional)</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {kind === "PDF" ? (
        <input
          type="file"
          name="file"
          accept="application/pdf,.pdf"
          required
          className="text-sm"
        />
      ) : (
        <textarea
          name="description"
          rows={3}
          placeholder="Consigna de la actividad"
          className="input resize-none"
        />
      )}

      {kind === "PDF" && (
        <textarea
          name="description"
          rows={2}
          placeholder="Descripción (opcional)"
          className="input resize-none"
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary self-start">
        {loading ? "Subiendo…" : "Agregar material"}
      </button>
    </form>
  );
}
