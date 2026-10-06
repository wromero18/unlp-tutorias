import { prisma } from "@/lib/prisma";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  const careers = await prisma.career.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      subjects: { orderBy: { name: "asc" }, select: { id: true, name: true } },
    },
  });

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-1">Creá tu cuenta</h1>
      <p className="text-sm text-secondary mb-8">
        Elegí si sos alumno o tutor para empezar.
      </p>
      <RegisterForm careers={careers} />
    </div>
  );
}
