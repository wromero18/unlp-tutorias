import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// El tutor acepta o rechaza una solicitud de tutoría.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body && typeof body === "object" ? body.status : undefined;

  if (status !== "ACCEPTED" && status !== "DECLINED") {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

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
    data: { status },
  });

  return NextResponse.json({ ok: true });
}
