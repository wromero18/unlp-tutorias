"use client";

import { useRouter } from "next/navigation";

type Career = { id: string; slug: string; name: string };

export function CarreraFilter({
  careers,
  selectedSlug,
}: {
  careers: Career[];
  selectedSlug?: string;
}) {
  const router = useRouter();

  return (
    <select
      value={selectedSlug ?? ""}
      onChange={(e) => {
        const value = e.target.value;
        router.push(value ? `/tutores?carrera=${value}` : "/tutores");
      }}
      className="input w-full sm:w-auto"
    >
      <option value="">Elegí tu carrera</option>
      {careers.map((c) => (
        <option key={c.id} value={c.slug}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
