import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Stub de activación de suscripción: no cobra nada de verdad, solo simula
 * el resultado de un pago exitoso para poder probar el flujo. Reemplazar
 * por el webhook real de la pasarela de pagos (Mercado Pago / Stripe)
 * cuando se integre.
 */
export async function POST() {
  const session = await auth();

  if (!session || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  await prisma.tutorProfile.update({
    where: { userId: session.user.id },
    data: { subscriptionStatus: "ACTIVE", subscriptionExpiresAt: expiresAt },
  });

  return NextResponse.json({ ok: true, expiresAt });
}
