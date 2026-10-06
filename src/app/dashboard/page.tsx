import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubscriptionCard } from "./subscription-card";
import { RequestActions } from "./request-actions";
import { DisconnectCalendarButton } from "./disconnect-calendar-button";
import { CalendarLinkForm } from "./calendar-link-form";
import { AddSubjectForm } from "./add-subject-form";
import { RemoveSubjectButton } from "./remove-subject-button";
import { AddMaterialForm } from "./add-material-form";
import { DeleteMaterialButton } from "./delete-material-button";
import { MeetingLinkForm } from "./meeting-link-form";
import { Stars } from "@/components/stars";
import { BusyBlocksList } from "@/components/busy-blocks";
import { getBusyBlocks, isGoogleCalendarConfigured, type BusyBlock } from "@/lib/google-calendar";

const CALENDAR_MESSAGES: Record<string, { text: string; error?: boolean }> = {
  connected: { text: "¡Tu Google Calendar quedó conectado!" },
  error: { text: "No pudimos conectar tu Google Calendar. Probá de nuevo.", error: true },
  "no-refresh-token": {
    text: "Google no envió los permisos necesarios. Quitale el acceso a la app desde myaccount.google.com/permissions y volvé a intentar.",
    error: true,
  },
};

const CLASS_DATE_FORMAT = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ calendar?: string }>;
}) {
  const { calendar } = await searchParams;
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "TUTOR") {
    const [profile, careers] = await Promise.all([
      prisma.tutorProfile.findUnique({
        where: { userId: session.user.id },
        include: {
          subjects: { include: { subject: { include: { career: true } } } },
          reviews: {
            include: { student: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
          },
          materials: {
            include: {
              subject: true,
              student: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      prisma.career.findMany({
        orderBy: { name: "asc" },
        include: { subjects: { orderBy: { name: "asc" } } },
      }),
    ]);

    const avgRating =
      profile && profile.reviews.length > 0
        ? profile.reviews.reduce((sum, r) => sum + r.rating, 0) / profile.reviews.length
        : 0;

    const requests = profile
      ? await prisma.tutoringRequest.findMany({
          where: { tutorId: profile.id },
          select: {
            id: true,
            status: true,
            meetingLink: true,
            scheduledAt: true,
            student: { select: { id: true, name: true } },
            subject: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

    const pending = requests.filter((r) => r.status === "PENDING");
    const accepted = requests.filter((r) => r.status === "ACCEPTED");
    // Nunca pasar el objeto User completo (tiene passwordHash) a un client
    // component: solo id y name, ya acotados arriba por el `select`.
    const students = Array.from(
      new Map(accepted.map((r) => [r.student.id, r.student])).values()
    );

    let busyBlocks: BusyBlock[] | null = null;
    let busyBlocksError = false;
    if (profile?.googleRefreshToken && profile.googleCalendarId) {
      try {
        const now = new Date();
        const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        busyBlocks = await getBusyBlocks(
          profile.googleRefreshToken,
          profile.googleCalendarId,
          now,
          in7Days
        );
      } catch {
        busyBlocksError = true;
      }
    }

    const calendarMessage = calendar ? CALENDAR_MESSAGES[calendar] : undefined;
    const hasSubjects = (profile?.subjects.length ?? 0) > 0;
    const isSubscriptionActive = profile?.subscriptionStatus === "ACTIVE";
    const isVisibleToStudents = hasSubjects && isSubscriptionActive;

    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-1">Hola, {session.user.name}</h1>
        <p className="text-sm text-secondary mb-4">Panel de tutor</p>

        {isVisibleToStudents ? (
          <p className="text-sm text-accent mb-6">
            ✓ Ya sos tutor: tu perfil es visible para los alumnos.
          </p>
        ) : (
          <p className="text-sm text-secondary mb-6">
            Todavía no sos visible para los alumnos —{" "}
            {!isSubscriptionActive && !hasSubjects
              ? "activá tu suscripción y elegí qué materias vas a dictar"
              : !isSubscriptionActive
                ? "activá tu suscripción"
                : "elegí qué materias vas a dictar"}{" "}
            (ver abajo).
          </p>
        )}

        {calendarMessage && (
          <p className={`text-sm mb-6 ${calendarMessage.error ? "text-red-600" : "text-accent"}`}>
            {calendarMessage.text}
          </p>
        )}

        <div className="flex flex-col gap-6">
          <SubscriptionCard
            status={profile?.subscriptionStatus ?? "INACTIVE"}
            expiresAt={profile?.subscriptionExpiresAt?.toISOString() ?? null}
          />

          <Section title="Tus materias">
            <div className="flex flex-wrap gap-2 mb-4">
              {profile?.subjects.map((ts) => (
                <span key={ts.subjectId} className="chip">
                  {ts.subject.name}{" "}
                  <span className="text-secondary">· {ts.subject.career.name}</span>
                  <RemoveSubjectButton subjectId={ts.subjectId} />
                </span>
              ))}
              {profile?.subjects.length === 0 && (
                <p className="text-sm text-secondary">
                  Todavía no elegiste materias.
                </p>
              )}
            </div>
            <AddSubjectForm
              careers={careers}
              existingSubjectIds={profile?.subjects.map((ts) => ts.subjectId) ?? []}
            />
          </Section>

          <Section title={`Solicitudes pendientes${pending.length ? ` (${pending.length})` : ""}`}>
            {pending.length === 0 ? (
              <p className="text-sm text-secondary">
                No tenés solicitudes pendientes por ahora.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {pending.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span>
                      <strong>{r.student.name}</strong> pidió tutoría en{" "}
                      {r.subject.name}
                    </span>
                    <RequestActions requestId={r.id} />
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title={`Tus alumnos${accepted.length ? ` (${accepted.length})` : ""}`}>
            {accepted.length === 0 ? (
              <p className="text-sm text-secondary">
                Todavía no tenés alumnos asignados.
              </p>
            ) : (
              <ul className="flex flex-col gap-3 text-sm">
                {accepted.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-col gap-1.5 border-t border-subtle pt-3 first:border-0 first:pt-0"
                  >
                    <div className="flex items-center justify-between">
                      <span>{r.student.name}</span>
                      <span className="text-secondary">{r.subject.name}</span>
                    </div>
                    <MeetingLinkForm
                      requestId={r.id}
                      initialUrl={r.meetingLink}
                      initialScheduledAt={r.scheduledAt?.toISOString() ?? null}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title={`Tus reseñas${profile?.reviews.length ? ` (${profile.reviews.length})` : ""}`}>
            <Stars rating={avgRating} count={profile?.reviews.length ?? 0} />
            {profile && profile.reviews.length > 0 && (
              <ul className="flex flex-col gap-3 mt-3">
                {profile.reviews.map((r) => (
                  <li key={r.id} className="border-t border-subtle pt-3 first:border-0 first:pt-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{r.student.name}</span>
                      <Stars rating={r.rating} size={14} />
                    </div>
                    {r.comment && (
                      <p className="text-sm text-secondary mt-1">{r.comment}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Google Calendar">
            <CalendarLinkForm initialUrl={profile?.calendarEmbedUrl ?? null} />

            {isGoogleCalendarConfigured() && (
              <div className="border-t border-subtle mt-5 pt-4">
                <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">
                  Opción avanzada: conectar tu cuenta de Google
                </p>
                {profile?.googleRefreshToken ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-secondary">
                        Conectado como <strong>{profile.googleAccountEmail}</strong>
                      </p>
                      <DisconnectCalendarButton />
                    </div>
                    <p className="text-sm font-medium mb-2">
                      Horarios ocupados (próximos 7 días)
                    </p>
                    {busyBlocksError ? (
                      <p className="text-sm text-red-600">
                        No pudimos leer tu calendario ahora. Probá de nuevo más tarde.
                      </p>
                    ) : (
                      <BusyBlocksList blocks={busyBlocks ?? []} />
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm text-secondary mb-3">
                      Esto conecta tu cuenta y muestra tus horarios ocupados
                      automáticamente, sin que tengas que pegar ningún link.
                    </p>
                    <a href="/api/google-calendar/connect" className="btn-secondary inline-block">
                      Conectar Google Calendar
                    </a>
                  </>
                )}
              </div>
            )}
          </Section>

          <Section title={`Materiales${profile?.materials.length ? ` (${profile.materials.length})` : ""}`}>
            <p className="text-xs text-secondary mb-3">
              Elegí si es para un alumno puntual o para todos. Solo lo ven
              alumnos con una tutoría aceptada con vos.
            </p>
            <AddMaterialForm
              subjects={profile?.subjects.map((ts) => ts.subject) ?? []}
              students={students}
            />
            {profile && profile.materials.length > 0 && (
              <ul className="flex flex-col gap-3 mt-5">
                {profile.materials.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-start justify-between gap-3 border-t border-subtle pt-3 first:border-0 first:pt-0"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="badge-neutral">{m.kind === "PDF" ? "PDF" : "Actividad"}</span>
                        <span className="text-sm font-medium">{m.title}</span>
                        {m.subject && (
                          <span className="text-xs text-secondary">· {m.subject.name}</span>
                        )}
                      </div>
                      <p className="text-xs text-secondary mt-0.5">
                        {m.student ? `Para: ${m.student.name}` : "Para: todos mis alumnos"}
                      </p>
                      {m.description && (
                        <p className="text-sm text-secondary mt-1">{m.description}</p>
                      )}
                      {m.kind === "PDF" && m.fileUrl && (
                        <a
                          href={m.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-accent text-sm"
                        >
                          Ver PDF
                        </a>
                      )}
                    </div>
                    <DeleteMaterialButton id={m.id} />
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    );
  }

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: { career: true },
  });

  const myRequests = await prisma.tutoringRequest.findMany({
    where: { studentId: session.user.id },
    include: {
      tutor: { include: { user: { select: { id: true, name: true } } } },
      subject: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-1">Hola, {session.user.name}</h1>
      <p className="text-sm text-secondary mb-8">
        Panel de alumno · {studentProfile?.career?.name ?? "Sin carrera"}
      </p>

      <div className="flex flex-col gap-6">
        <Section title="Buscar tutores">
          <p className="text-sm text-secondary mb-3">
            Encontrá tutores de tu carrera y solicitá tu clase.
          </p>
          <a href="/tutores" className="btn-primary inline-block">
            Ver tutores
          </a>
        </Section>

        <Section title="Tus solicitudes">
          {myRequests.length === 0 ? (
            <p className="text-sm text-secondary">
              Todavía no solicitaste ninguna tutoría.
            </p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {myRequests.map((r) => (
                <li key={r.id} className="flex flex-col gap-1 border-t border-subtle pt-2 first:border-0 first:pt-0">
                  <div className="flex items-center justify-between">
                    <span>
                      <Link href={`/tutores/${r.tutorId}`} className="hover:underline">
                        {r.tutor.user.name}
                      </Link>{" "}
                      · {r.subject.name}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                  {r.status === "ACCEPTED" && r.scheduledAt && (
                    <p className="text-xs text-secondary capitalize">
                      {CLASS_DATE_FORMAT.format(r.scheduledAt)}hs
                    </p>
                  )}
                  {r.status === "ACCEPTED" && (
                    <div className="flex gap-2 flex-wrap">
                      {r.meetingLink && (
                        <a
                          href={r.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary text-xs px-2.5 py-1 self-start"
                        >
                          Unirse a la clase
                        </a>
                      )}
                      <Link
                        href={`/tutores/${r.tutorId}`}
                        className="btn-secondary text-xs px-2.5 py-1 self-start"
                      >
                        Ver materiales y dejar reseña
                      </Link>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label =
    status === "ACCEPTED"
      ? "Aceptada"
      : status === "DECLINED"
        ? "Rechazada"
        : "Pendiente";
  const className =
    status === "ACCEPTED"
      ? "badge-success"
      : status === "DECLINED"
        ? "badge-neutral"
        : "badge-warning";
  return <span className={className}>{label}</span>;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <h2 className="font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}
