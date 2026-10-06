import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Stars } from "@/components/stars";
import { BusyBlocksList } from "@/components/busy-blocks";
import { CalendarEmbed } from "@/components/calendar-embed";
import { getBusyBlocks, type BusyBlock } from "@/lib/google-calendar";
import { RequestButton } from "../request-button";
import { ReviewForm } from "./review-form";

// Un alumno ve los materiales generales del tutor (studentId null) y los
// que el tutor le asignó puntualmente a él.
function getMaterialsFor(tutorId: string, studentId: string) {
  return prisma.material.findMany({
    where: { tutorId, OR: [{ studentId: null }, { studentId }] },
    include: { subject: true },
    orderBy: { createdAt: "desc" },
  });
}

export default async function TutorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const tutor = await prisma.tutorProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true } },
      subjects: { include: { subject: { include: { career: true } } } },
      reviews: {
        include: { student: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!tutor || tutor.subscriptionStatus !== "ACTIVE") {
    notFound();
  }

  const avgRating =
    tutor.reviews.length > 0
      ? tutor.reviews.reduce((sum, r) => sum + r.rating, 0) / tutor.reviews.length
      : 0;

  let requestedKeys = new Set<string>();
  let canReview = false;
  let myReview: { rating: number; comment: string | null } | null = null;
  let materials: Awaited<ReturnType<typeof getMaterialsFor>> = [];

  if (session?.user.role === "STUDENT") {
    const [myRequests, acceptedWithTutor, existingReview] = await Promise.all([
      prisma.tutoringRequest.findMany({
        where: { studentId: session.user.id, tutorId: tutor.id, status: { not: "DECLINED" } },
        select: { subjectId: true },
      }),
      prisma.tutoringRequest.findFirst({
        where: { studentId: session.user.id, tutorId: tutor.id, status: "ACCEPTED" },
      }),
      prisma.review.findUnique({
        where: { studentId_tutorId: { studentId: session.user.id, tutorId: tutor.id } },
      }),
    ]);

    requestedKeys = new Set(myRequests.map((r) => r.subjectId));
    canReview = Boolean(acceptedWithTutor);
    myReview = existingReview
      ? { rating: existingReview.rating, comment: existingReview.comment }
      : null;

    if (canReview) {
      materials = await getMaterialsFor(tutor.id, session.user.id);
    }
  }

  let busyBlocks: BusyBlock[] | null = null;
  if (tutor.googleRefreshToken && tutor.googleCalendarId) {
    try {
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      busyBlocks = await getBusyBlocks(
        tutor.googleRefreshToken,
        tutor.googleCalendarId,
        now,
        in7Days
      );
    } catch {
      busyBlocks = null;
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="card mb-6">
        <h1 className="text-2xl font-bold mb-1">{tutor.user.name}</h1>
        <Stars rating={avgRating} count={tutor.reviews.length} />
        {tutor.bio && <p className="text-sm text-secondary mt-3">{tutor.bio}</p>}
        {tutor.hourlyRate && (
          <p className="text-sm font-medium mt-2">
            ${tutor.hourlyRate.toLocaleString("es-AR")}/hora
          </p>
        )}

        <div className="flex flex-col gap-2 mt-4">
          {tutor.subjects.map((ts) => (
            <div
              key={ts.subject.id}
              className="flex items-center justify-between gap-2 text-sm border-t border-subtle pt-2 first:border-0 first:pt-0"
            >
              <span>
                {ts.subject.name}{" "}
                <span className="text-secondary">· {ts.subject.career.name}</span>
              </span>
              {session?.user.role === "STUDENT" && (
                <RequestButton
                  tutorId={tutor.id}
                  subjectId={ts.subject.id}
                  initiallyRequested={requestedKeys.has(ts.subject.id)}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {tutor.calendarEmbedUrl && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-3">Calendario</h2>
          <CalendarEmbed url={tutor.calendarEmbedUrl} />
        </div>
      )}

      {busyBlocks && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-1">Disponibilidad</h2>
          <p className="text-xs text-secondary mb-3">
            Horarios ocupados según su Google Calendar. Fuera de estos
            horarios, coordiná con el tutor al aceptar tu solicitud.
          </p>
          <BusyBlocksList blocks={busyBlocks} />
        </div>
      )}

      {canReview && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-3">
            Materiales{materials.length ? ` (${materials.length})` : ""}
          </h2>
          {materials.length === 0 ? (
            <p className="text-sm text-secondary">
              Tu tutor todavía no compartió materiales.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {materials.map((m) => (
                <li key={m.id} className="border-t border-subtle pt-3 first:border-0 first:pt-0">
                  <div className="flex items-center gap-2">
                    <span className="badge-neutral">{m.kind === "PDF" ? "PDF" : "Actividad"}</span>
                    <span className="text-sm font-medium">{m.title}</span>
                    {m.subject && (
                      <span className="text-xs text-secondary">· {m.subject.name}</span>
                    )}
                  </div>
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
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {canReview && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-3">
            {myReview ? "Tu reseña" : "Dejá tu reseña"}
          </h2>
          <ReviewForm
            tutorId={tutor.id}
            initialRating={myReview?.rating ?? 0}
            initialComment={myReview?.comment ?? ""}
          />
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-3">
          Reseñas{tutor.reviews.length ? ` (${tutor.reviews.length})` : ""}
        </h2>
        {tutor.reviews.length === 0 ? (
          <p className="text-sm text-secondary">Todavía no tiene reseñas.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {tutor.reviews.map((r) => (
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
      </div>
    </div>
  );
}
