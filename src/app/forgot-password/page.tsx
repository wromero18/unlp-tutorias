import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold mb-1">Recuperar contraseña</h1>
      <p className="text-sm text-secondary mb-8">
        Ingresá el email con el que te registraste y te mandamos un link para
        elegir una nueva contraseña.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
