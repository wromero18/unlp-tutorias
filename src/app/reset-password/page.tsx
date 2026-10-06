import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold mb-1">Elegí tu nueva contraseña</h1>
      <p className="text-sm text-secondary mb-8">
        Tiene que tener al menos 8 caracteres.
      </p>
      <ResetPasswordForm token={token ?? ""} />
    </div>
  );
}
