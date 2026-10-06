import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { savePdfFile, MAX_PDF_SIZE_BYTES } from "@/lib/materials-storage";

// El tutor sube un PDF o crea una actividad, para un alumno puntual o para
// todos sus alumnos.
export async function POST(request: Request) {
  const session = await auth();

  if (!session || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const profile = await prisma.tutorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const kind = form.get("kind");
  const title = form.get("title");
  const description = form.get("description");
  const subjectIdRaw = form.get("subjectId");
  const studentIdRaw = form.get("studentId");
  const file = form.get("file");

  if (
    (kind !== "PDF" && kind !== "ACTIVITY") ||
    typeof title !== "string" ||
    title.trim().length < 2
  ) {
    return NextResponse.json(
      { error: "Completá un título y elegí PDF o Actividad." },
      { status: 400 }
    );
  }

  let subjectId: string | null = null;
  if (typeof subjectIdRaw === "string" && subjectIdRaw.length > 0) {
    const ownsSubject = await prisma.tutorSubject.findUnique({
      where: { tutorId_subjectId: { tutorId: profile.id, subjectId: subjectIdRaw } },
    });
    if (!ownsSubject) {
      return NextResponse.json({ error: "Materia inválida." }, { status: 400 });
    }
    subjectId = subjectIdRaw;
  }

  let studentId: string | null = null;
  if (typeof studentIdRaw === "string" && studentIdRaw.length > 0) {
    const isMyStudent = await prisma.tutoringRequest.findFirst({
      where: { tutorId: profile.id, studentId: studentIdRaw, status: "ACCEPTED" },
    });
    if (!isMyStudent) {
      return NextResponse.json(
        { error: "Ese alumno no tiene una tutoría aceptada con vos." },
        { status: 400 }
      );
    }
    studentId = studentIdRaw;
  }

  const trimmedDescription =
    typeof description === "string" ? description.trim().slice(0, 2000) || null : null;

  const baseData = {
    tutorId: profile.id,
    subjectId,
    studentId,
    title: title.trim(),
    description: trimmedDescription,
  };

  if (kind === "ACTIVITY") {
    const material = await prisma.material.create({
      data: { ...baseData, kind: "ACTIVITY" },
    });
    return NextResponse.json({ id: material.id }, { status: 201 });
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Subí un archivo PDF." }, { status: 400 });
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "El archivo tiene que ser un PDF." }, { status: 400 });
  }
  if (file.size > MAX_PDF_SIZE_BYTES) {
    return NextResponse.json({ error: "El PDF no puede pesar más de 10MB." }, { status: 400 });
  }

  const { fileUrl, fileName } = await savePdfFile(file);

  const material = await prisma.material.create({
    data: { ...baseData, kind: "PDF", fileUrl, fileName },
  });

  return NextResponse.json({ id: material.id }, { status: 201 });
}
