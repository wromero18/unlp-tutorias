import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revokeGoogleToken } from "@/lib/google-calendar";

export async function POST() {
  const session = await auth();

  if (!session || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const profile = await prisma.tutorProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (profile?.googleRefreshToken) {
    await revokeGoogleToken(profile.googleRefreshToken);
  }

  await prisma.tutorProfile.update({
    where: { userId: session.user.id },
    data: {
      googleRefreshToken: null,
      googleAccountEmail: null,
      googleCalendarId: null,
      googleCalendarConnectedAt: null,
    },
  });

  return NextResponse.json({ ok: true });
}
