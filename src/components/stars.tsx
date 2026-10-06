"use client";

import { useState } from "react";

function Star({ filled, size = 16 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill={filled ? "#f59e0b" : "none"}
      stroke={filled ? "#f59e0b" : "var(--text-secondary)"}
      strokeWidth={1.5}
    >
      <path
        strokeLinejoin="round"
        d="M10 1.5l2.59 5.25 5.79.84-4.19 4.09.99 5.77L10 14.77l-5.18 2.68.99-5.77L1.62 7.6l5.79-.84L10 1.5z"
      />
    </svg>
  );
}

// Solo lectura: muestra un promedio (redondeado al entero más cercano).
export function Stars({
  rating,
  count,
  size = 16,
}: {
  rating: number;
  count?: number;
  size?: number;
}) {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} filled={n <= rounded} size={size} />
        ))}
      </div>
      {typeof count === "number" && (
        <span className="text-xs text-secondary">
          {rating > 0 ? rating.toFixed(1) : "Sin reseñas"}
          {count > 0 && ` (${count})`}
        </span>
      )}
    </div>
  );
}

// Interactivo: para que el alumno elija una calificación de 1 a 5.
export function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value;

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(null)}
          aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
          className="p-0.5"
        >
          <Star filled={n <= display} size={22} />
        </button>
      ))}
    </div>
  );
}
