import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Un alumno solicita una tutoría a un tutor en una materia puntual.
export async function POST(request: Request) {
  const session = await auth();

  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const tutorId = body && typeof body === "object" ? body.tutorId : undefined;
  const subjectId = body && typeof body === "object" ? body.subjectId : undefined;

  if (typeof tutorId !== "string" || typeof subjectId !== "string") {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const tutorTeachesSubject = await prisma.tutorSubject.findUnique({
    where: { tutorId_subjectId: { tutorId, subjectId } },
  });

  if (!tutorTeachesSubject) {
    return NextResponse.json(
      { error: "Ese tutor no dicta esa materia." },
      { status: 400 }
    );
  }

  const existing = await prisma.tutoringRequest.findUnique({
    where: {
      studentId_tutorId_subjectId: {
        studentId: session.user.id,
        tutorId,
        subjectId,
      },
    },
  });

  if (existing && existing.status !== "DECLINED") {
    return NextResponse.json(
      { error: "Ya tenés una solicitud con este tutor en esta materia." },
      { status: 409 }
    );
  }

  const tutoringRequest = existing
    ? await prisma.tutoringRequest.update({
        where: { id: existing.id },
        data: { status: "PENDING" },
      })
    : await prisma.tutoringRequest.create({
        data: { studentId: session.user.id, tutorId, subjectId },
      });

  return NextResponse.json({ id: tutoringRequest.id }, { status: 201 });
}
