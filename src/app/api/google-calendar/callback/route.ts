import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForTokens, getGoogleAccountEmail } from "@/lib/google-calendar";

// Google redirige acá después de que el tutor acepta (o rechaza) el consentimiento.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const dashboardUrl = new URL("/dashboard", url.origin);

  const session = await auth();
  if (!session || session.user.role !== "TUTOR") {
    dashboardUrl.searchParams.set("calendar", "error");
    return NextResponse.redirect(dashboardUrl);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const cookieState = request.headers
    .get("cookie")
    ?.match(/google_oauth_state=([^;]+)/)?.[1];

  if (error || !code || !state || !cookieState || state !== cookieState) {
    dashboardUrl.searchParams.set("calendar", "error");
    const response = NextResponse.redirect(dashboardUrl);
    response.cookies.delete("google_oauth_state");
    return response;
  }

  try {
    const redirectUri = `${url.origin}/api/google-calendar/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    if (!tokens.refresh_token) {
      // Google no manda refresh_token si el usuario ya había autorizado antes
      // sin revocar el acceso. Le pedimos que revoque y vuelva a intentar.
      dashboardUrl.searchParams.set("calendar", "no-refresh-token");
      const response = NextResponse.redirect(dashboardUrl);
      response.cookies.delete("google_oauth_state");
      return response;
    }

    const email = await getGoogleAccountEmail(tokens.access_token);

    await prisma.tutorProfile.update({
      where: { userId: session.user.id },
      data: {
        googleRefreshToken: tokens.refresh_token,
        googleAccountEmail: email,
        googleCalendarId: "primary",
        googleCalendarConnectedAt: new Date(),
      },
    });

    dashboardUrl.searchParams.set("calendar", "connected");
  } catch {
    dashboardUrl.searchParams.set("calendar", "error");
  }

  const response = NextResponse.redirect(dashboardUrl);
  response.cookies.delete("google_oauth_state");
  return response;
}
