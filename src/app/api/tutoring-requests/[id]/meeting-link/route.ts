import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isValidMeetingUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

// El tutor carga (o cambia) el link de Zoom/Meet para una tutoría aceptada.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const url = body && typeof body === "object" ? body.url : undefined;
  const scheduledAtRaw = body && typeof body === "object" ? body.scheduledAt : undefined;

  if (typeof url !== "string" || !isValidMeetingUrl(url)) {
    return NextResponse.json(
      { error: "Pegá un link válido (tiene que empezar con https://)." },
      { status: 400 }
    );
  }

  let scheduledAt: Date | null = null;
  if (typeof scheduledAtRaw === "string" && scheduledAtRaw.length > 0) {
    const parsed = new Date(scheduledAtRaw);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "Fecha inválida." }, { status: 400 });
    }
    scheduledAt = parsed;
  }

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId: session.user.id },
  });

  const tutoringRequest = await prisma.tutoringRequest.findUnique({
    where: { id },
  });

  if (
    !tutorProfile ||
    tutoringRequest?.tutorId !== tutorProfile.id ||
    tutoringRequest.status !== "ACCEPTED"
  ) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  await prisma.tutoringRequest.update({
    where: { id },
    data: { meetingLink: url, scheduledAt },
  });

  return NextResponse.json({ ok: true });
}

// El tutor quita el link de la clase.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId: session.user.id },
  });

  const tutoringRequest = await prisma.tutoringRequest.findUnique({
    where: { id },
  });

  if (!tutorProfile || tutoringRequest?.tutorId !== tutorProfile.id) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  await prisma.tutoringRequest.update({
    where: { id },
    data: { meetingLink: null, scheduledAt: null },
  });

  return NextResponse.json({ ok: true });
}
