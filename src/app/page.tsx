import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <div className="max-w-2xl">
        <span className="chip mb-4">Impulsa tu carrera al siguiente nivel</span>
        <h1 className="text-4xl font-bold tracking-tight mb-4 text-primary">
          Tutorías particulares para estudiantes de la UNLP
        </h1>
        <p className="text-lg text-secondary mb-8">
          Conectamos a alumnos de la UNLP con tutores de confianza. Los
          tutores publican su disponibilidad con Google Calendar y los
          alumnos solicitan clases según su carrera y materia.
        </p>
        <div className="flex gap-3">
          <Link href="/register" className="btn-primary">
            Empezar ahora
          </Link>
          <Link href="/tutores" className="btn-secondary">
            Ver tutores
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-6 mt-20">
        <FeatureCard
          title="Para alumnos"
          description="Buscá tutores por carrera y materia, mirá su disponibilidad y solicitá tu clase."
        />
        <FeatureCard
          title="Para tutores"
          description="Publicá tu perfil, conectá tu Google Calendar y gestioná tus alumnos."
        />
        <FeatureCard
          title="Multi-carrera"
          description="Materias reales de 17 carreras de la UNLP: Medicina, Ingeniería, Abogacía, Psicología y muchas más."
        />
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="card">
      <h3 className="font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-secondary">{description}</p>
    </div>
  );
}
