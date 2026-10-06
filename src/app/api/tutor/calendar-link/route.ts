import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isValidGoogleCalendarUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "calendar.google.com";
  } catch {
    return false;
  }
}

// El tutor pega el link público/embed de su Google Calendar para mostrarlo
// anclado en su perfil, sin necesitar OAuth.
export async function POST(request: Request) {
  const session = await auth();

  if (!session || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const url = body && typeof body === "object" ? body.url : undefined;

  if (typeof url !== "string" || !isValidGoogleCalendarUrl(url)) {
    return NextResponse.json(
      {
        error:
          "Pegá un link válido de Google Calendar (tiene que empezar con https://calendar.google.com/).",
      },
      { status: 400 }
    );
  }

  await prisma.tutorProfile.update({
    where: { userId: session.user.id },
    data: { calendarEmbedUrl: url },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await auth();

  if (!session || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  await prisma.tutorProfile.update({
    where: { userId: session.user.id },
    data: { calendarEmbedUrl: null },
  });

  return NextResponse.json({ ok: true });
}
