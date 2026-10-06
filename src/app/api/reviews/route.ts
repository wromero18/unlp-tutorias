import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Un alumno deja o actualiza su reseña sobre un tutor. Solo puede hacerlo si
// tuvo al menos una tutoría aceptada con ese tutor.
export async function POST(request: Request) {
  const session = await auth();

  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const tutorId = body && typeof body === "object" ? body.tutorId : undefined;
  const rating = body && typeof body === "object" ? body.rating : undefined;
  const comment = body && typeof body === "object" ? body.comment : undefined;

  if (
    typeof tutorId !== "string" ||
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    (comment !== undefined && comment !== null && typeof comment !== "string")
  ) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const hadAcceptedTutoring = await prisma.tutoringRequest.findFirst({
    where: { studentId: session.user.id, tutorId, status: "ACCEPTED" },
  });

  if (!hadAcceptedTutoring) {
    return NextResponse.json(
      {
        error:
          "Solo podés dejar una reseña de un tutor con el que ya tuviste una tutoría aceptada.",
      },
      { status: 403 }
    );
  }

  const trimmedComment =
    typeof comment === "string" ? comment.trim().slice(0, 1000) || null : null;

  const review = await prisma.review.upsert({
    where: { studentId_tutorId: { studentId: session.user.id, tutorId } },
    update: { rating, comment: trimmedComment },
    create: {
      studentId: session.user.id,
      tutorId,
      rating,
      comment: trimmedComment,
    },
  });

  return NextResponse.json({ id: review.id }, { status: 201 });
}
