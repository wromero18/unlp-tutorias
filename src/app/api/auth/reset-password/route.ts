import { NextResponse } from "next/server";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const MAX_PASSWORD_LENGTH = 72; // bcrypt ignora en silencio lo que sigue de acá

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`reset-password:${ip}`, 20, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Probá de nuevo más tarde." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const token = body && typeof body === "object" ? body.token : undefined;
  const password = body && typeof body === "object" ? body.password : undefined;

  if (
    typeof token !== "string" ||
    token.length === 0 ||
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    return NextResponse.json(
      { error: "Datos inválidos. La contraseña debe tener al menos 8 caracteres." },
      { status: 400 }
    );
  }

  const tokenHash = hashToken(token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.expiresAt.getTime() < Date.now()
  ) {
    return NextResponse.json(
      { error: "El link venció o ya se usó. Pedí uno nuevo." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    // Cualquier otro link pendiente para este usuario queda invalidado.
    prisma.passwordResetToken.deleteMany({
      where: { userId: resetToken.userId, usedAt: null },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
