"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StarRatingInput } from "@/components/stars";

export function ReviewForm({
  tutorId,
  initialRating,
  initialComment,
}: {
  tutorId: string;
  initialRating: number;
  initialComment: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Elegí una calificación de 1 a 5 estrellas.");
      return;
    }

    setLoading(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tutorId, rating, comment }),
    });

    setLoading(false);

    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No se pudo guardar la reseña.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <StarRatingInput value={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Contá cómo fue tu experiencia (opcional)"
        className="input resize-none"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && !error && (
        <p className="text-sm text-accent">¡Gracias por tu reseña!</p>
      )}
      <button type="submit" disabled={loading} className="btn-primary self-start">
        {loading ? "Guardando…" : "Guardar reseña"}
      </button>
    </form>
  );
}
