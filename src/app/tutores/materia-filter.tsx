"use client";

import { useRouter } from "next/navigation";

type Subject = { id: string; slug: string; name: string };

export function MateriaFilter({
  careerSlug,
  subjects,
  selectedSlug,
}: {
  careerSlug: string;
  subjects: Subject[];
  selectedSlug?: string;
}) {
  const router = useRouter();

  return (
    <select
      value={selectedSlug ?? ""}
      onChange={(e) => {
        const value = e.target.value;
        const params = new URLSearchParams({ carrera: careerSlug });
        if (value) params.set("materia", value);
        router.push(`/tutores?${params.toString()}`);
      }}
      className="input w-full sm:w-auto"
    >
      <option value="">Elegí tu materia</option>
      {subjects.map((s) => (
        <option key={s.id} value={s.slug}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
