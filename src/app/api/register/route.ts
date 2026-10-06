import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { Role } from "@prisma/client";

const USERNAME_REGEX = /^[a-zA-Z0-9_.]{3,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254; // límite práctico de un email según el RFC
const MAX_PASSWORD_LENGTH = 72; // bcrypt ignora silenciosamente lo que sigue

export async function POST(request: Request) {
  // Frena registros masivos automatizados desde una misma IP.
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`register:${ip}`, 10, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Probá de nuevo más tarde." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const { name, email, username, password, role, careerId, subjectIds, bio, hourlyRate } =
    body as Record<string, unknown>;

  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.trim().length > MAX_NAME_LENGTH ||
    typeof email !== "string" ||
    email.length > MAX_EMAIL_LENGTH ||
    !EMAIL_REGEX.test(email) ||
    typeof username !== "string" ||
    !USERNAME_REGEX.test(username) ||
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > MAX_PASSWORD_LENGTH ||
    (role !== "STUDENT" && role !== "TUTOR")
  ) {
    return NextResponse.json(
      {
        error:
          "Revisá los datos: nombre, email y usuario válidos, contraseña de al menos 8 caracteres, y rol.",
      },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim().toLowerCase();

  if (role === "STUDENT" && typeof careerId !== "string") {
    return NextResponse.json({ error: "Elegí tu carrera." }, { status: 400 });
  }

  const subjectIdList = Array.isArray(subjectIds)
    ? subjectIds.filter((id): id is string => typeof id === "string")
    : [];

  if (role === "TUTOR" && subjectIdList.length === 0) {
    return NextResponse.json(
      { error: "Elegí al menos una materia en la que puedas dar tutorías." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: normalizedEmail }, { username: normalizedUsername }] },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese email o usuario." },
      { status: 409 }
    );
  }

  if (role === "TUTOR") {
    const subjects = await prisma.subject.findMany({
      where: { id: { in: subjectIdList } },
      select: { id: true },
    });

    if (subjects.length !== subjectIdList.length) {
      return NextResponse.json(
        { error: "Una o más materias seleccionadas no son válidas." },
        { status: 400 }
      );
    }
  } else {
    const career = await prisma.career.findUnique({
      where: { id: careerId as string },
      select: { id: true },
    });

    if (!career) {
      return NextResponse.json(
        { error: "La carrera seleccionada no es válida." },
        { status: 400 }
      );
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const typedRole = role as Role;

  try {
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        username: normalizedUsername,
        passwordHash,
        role: typedRole,
        ...(typedRole === "STUDENT"
          ? {
              studentProfile: {
                create: { careerId: careerId as string },
              },
            }
          : {
              tutorProfile: {
                create: {
                  bio: typeof bio === "string" ? bio.trim() || null : null,
                  hourlyRate:
                    typeof hourlyRate === "number" && hourlyRate > 0
                      ? hourlyRate
                      : null,
                  subjects: {
                    create: subjectIdList.map((subjectId) => ({ subjectId })),
                  },
                },
              },
            }),
      },
      select: { id: true },
    });

    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch (error) {
    // Carrera: dos registros con el mismo email/usuario llegaron casi a la
    // vez y ambos pasaron el chequeo de "existing" de arriba.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese email o usuario." },
        { status: 409 }
      );
    }
    throw error;
  }
}
