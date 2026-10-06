import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RequestButton } from "./request-button";
import { MateriaFilter } from "./materia-filter";
import { CarreraFilter } from "./carrera-filter";
import { Stars } from "@/components/stars";
import { CalendarEmbed } from "@/components/calendar-embed";
import { BusyBlocksList } from "@/components/busy-blocks";
import { getBusyBlocks, type BusyBlock } from "@/lib/google-calendar";

export default async function TutoresPage({
  searchParams,
}: {
  searchParams: Promise<{ carrera?: string; materia?: string }>;
}) {
  const { carrera, materia } = await searchParams;
  const session = await auth();

  // El directorio es para que un alumno busque tutor; un tutor no busca a
  // otro tutor, así que lo mandamos a su panel (ahí gestiona sus materias).
  if (session?.user.role === "TUTOR") {
    redirect("/dashboard");
  }

  const careers = await prisma.career.findMany({
    orderBy: { name: "asc" },
    include: { subjects: { orderBy: { name: "asc" } } },
  });
  const selected = careers.find((c) => c.slug === carrera);
  const selectedSubject = selected?.subjects.find((s) => s.slug === materia);

  const tutors = selectedSubject
    ? await prisma.tutorProfile.findMany({
        where: {
          subscriptionStatus: "ACTIVE",
          subjects: { some: { subjectId: selectedSubject.id } },
        },
        include: {
          user: { select: { id: true, name: true } },
          subjects: {
            where: { subjectId: selectedSubject.id },
            include: { subject: true },
          },
          reviews: { select: { rating: true } },
        },
      })
    : [];

  let requestedKeys = new Set<string>();
  if (session?.user.role === "STUDENT") {
    const myRequests = await prisma.tutoringRequest.findMany({
      where: { studentId: session.user.id, status: { not: "DECLINED" } },
      select: { tutorId: true, subjectId: true },
    });
    requestedKeys = new Set(myRequests.map((r) => `${r.tutorId}:${r.subjectId}`));
  }

  // Disponibilidad (opción OAuth) para los tutores que aparecen en el resultado.
  const busyBlocksByTutor = new Map<string, BusyBlock[] | "error">();
  if (selectedSubject) {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    await Promise.all(
      tutors
        .filter((t) => t.googleRefreshToken && t.googleCalendarId)
        .map(async (t) => {
          try {
            const blocks = await getBusyBlocks(
              t.googleRefreshToken!,
              t.googleCalendarId!,
              now,
              in7Days
            );
            busyBlocksByTutor.set(t.id, blocks);
          } catch {
            busyBlocksByTutor.set(t.id, "error");
          }
        })
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-1">Tutores</h1>
      <p className="text-sm text-secondary mb-6">
        Elegí tu carrera y tu materia para ver qué tutores están disponibles.
      </p>

      <div className="flex flex-col sm:flex-row gap-2 mb-8">
        <CarreraFilter careers={careers} selectedSlug={selected?.slug} />
        {selected && (
          <MateriaFilter
            careerSlug={selected.slug}
            subjects={selected.subjects}
            selectedSlug={materia}
          />
        )}
      </div>

      {!selected && (
        <p className="text-sm text-secondary">
          Empezá eligiendo tu carrera arriba.
        </p>
      )}

      {selected && !selectedSubject && (
        <p className="text-sm text-secondary">
          Ahora elegí la materia en la que necesitás una tutoría.
        </p>
      )}

      {selectedSubject && tutors.length === 0 && (
        <p className="text-sm text-secondary">
          Todavía no hay tutores disponibles para esta materia.
        </p>
      )}

      {selectedSubject && tutors.length > 0 && (
        <div className="flex flex-col gap-4">
          {tutors.map((t) => {
            const avgRating =
              t.reviews.length > 0
                ? t.reviews.reduce((sum, r) => sum + r.rating, 0) / t.reviews.length
                : 0;
            const busyBlocks = busyBlocksByTutor.get(t.id);

            return (
              <div key={t.id} className="card">
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/tutores/${t.id}`} className="font-semibold hover:underline">
                    {t.user.name}
                  </Link>
                  <Stars rating={avgRating} count={t.reviews.length} size={14} />
                </div>
                {t.bio && <p className="text-sm text-secondary mt-1">{t.bio}</p>}
                {t.hourlyRate && (
                  <p className="text-sm mt-2 font-medium">
                    ${t.hourlyRate.toLocaleString("es-AR")}/hora
                  </p>
                )}

                <div className="flex items-center justify-between gap-2 text-sm mt-3 border-t border-subtle pt-3">
                  <span>{selectedSubject.name}</span>
                  {session?.user.role === "STUDENT" && (
                    <RequestButton
                      tutorId={t.id}
                      subjectId={selectedSubject.id}
                      initiallyRequested={requestedKeys.has(`${t.id}:${selectedSubject.id}`)}
                    />
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-subtle">
                  <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">
                    Disponibilidad
                  </p>
                  {t.calendarEmbedUrl ? (
                    <CalendarEmbed url={t.calendarEmbedUrl} />
                  ) : busyBlocks === "error" ? (
                    <p className="text-sm text-red-600">
                      No pudimos leer el calendario de este tutor ahora.
                    </p>
                  ) : busyBlocks ? (
                    <>
                      <p className="text-xs text-secondary mb-2">
                        Horarios ocupados (próximos 7 días); fuera de estos
                        horarios, coordiná con el tutor al aceptar tu solicitud.
                      </p>
                      <BusyBlocksList blocks={busyBlocks} />
                    </>
                  ) : (
                    <p className="text-sm text-secondary">
                      Este tutor todavía no compartió su calendario.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
