import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deletePdfFile } from "@/lib/materials-storage";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;

  const profile = await prisma.tutorProfile.findUnique({
    where: { userId: session.user.id },
  });

  const material = await prisma.material.findUnique({ where: { id } });

  if (!profile || material?.tutorId !== profile.id) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  if (material.fileUrl) {
    await deletePdfFile(material.fileUrl);
  }

  await prisma.material.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
