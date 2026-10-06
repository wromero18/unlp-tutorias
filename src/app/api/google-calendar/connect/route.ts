import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { auth } from "@/lib/auth";
import { getGoogleOAuthUrl, isGoogleCalendarConfigured } from "@/lib/google-calendar";

// Arranca el flujo de OAuth: redirige al tutor a la pantalla de consentimiento de Google.
export async function GET(request: Request) {
  const session = await auth();

  if (!session || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      { error: "La integración con Google Calendar no está configurada." },
      { status: 503 }
    );
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/google-calendar/callback`;
  const state = crypto.randomBytes(16).toString("hex");

  const response = NextResponse.redirect(getGoogleOAuthUrl(redirectUri, state));
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
