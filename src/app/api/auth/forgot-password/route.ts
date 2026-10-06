import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendPasswordResetEmail, isEmailConfigured } from "@/lib/email";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_MESSAGE =
  "Si ese email está registrado, te mandamos un link para restablecer tu contraseña.";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  // Límite generoso pero real: evita que alguien use este formulario para
  // mandar spam de mails o para adivinar qué emails están registrados.
  const ipLimit = checkRateLimit(`forgot-password:ip:${ip}`, 10, 60 * 60 * 1000);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Probá de nuevo más tarde." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const email = body && typeof body === "object" ? body.email : undefined;

  if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Ingresá un email válido." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const emailLimit = checkRateLimit(
    `forgot-password:email:${normalizedEmail}`,
    5,
    60 * 60 * 1000
  );
  if (!emailLimit.allowed) {
    // Mismo mensaje genérico: no delatamos que este email en particular
    // está siendo limitado (eso también filtraría si existe o no).
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true },
  });

  let devResetUrl: string | undefined;

  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.$transaction([
      // Invalidamos tokens viejos sin usar para que no queden varios activos.
      prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      }),
      prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      }),
    ]);

    const origin = new URL(request.url).origin;
    const resetUrl = `${origin}/reset-password?token=${rawToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (error) {
      console.error("No se pudo enviar el mail de restablecimiento:", error);
    }

    if (process.env.NODE_ENV !== "production" && !isEmailConfigured()) {
      devResetUrl = resetUrl;
    }
  }

  // Siempre la misma respuesta exista o no el email: si no, un atacante
  // podría usar este formulario para saber qué emails están registrados.
  return NextResponse.json({ message: GENERIC_MESSAGE, devResetUrl });
}
