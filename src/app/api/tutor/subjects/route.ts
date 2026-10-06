import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// El tutor agrega una materia a su perfil (elegida por carrera + materia).
export async function POST(request: Request) {
  const session = await auth();

  if (!session || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const subjectId = body && typeof body === "object" ? body.subjectId : undefined;

  if (typeof subjectId !== "string") {
    return NextResponse.json({ error: "Elegí una materia." }, { status: 400 });
  }

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) {
    return NextResponse.json({ error: "La materia elegida no es válida." }, { status: 400 });
  }

  const profile = await prisma.tutorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  const existing = await prisma.tutorSubject.findUnique({
    where: { tutorId_subjectId: { tutorId: profile.id, subjectId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Ya tenés esa materia agregada." }, { status: 409 });
  }

  await prisma.tutorSubject.create({ data: { tutorId: profile.id, subjectId } });

  return NextResponse.json({ ok: true }, { status: 201 });
}

// El tutor quita una materia de su perfil.
export async function DELETE(request: Request) {
  const session = await auth();

  if (!session || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const subjectId = body && typeof body === "object" ? body.subjectId : undefined;

  if (typeof subjectId !== "string") {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const profile = await prisma.tutorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  await prisma.tutorSubject.deleteMany({
    where: { tutorId: profile.id, subjectId },
  });

  return NextResponse.json({ ok: true });
}
