import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold mb-1">Iniciar sesión</h1>
      <p className="text-sm text-secondary mb-8">
        Ingresá con tu usuario o email.
      </p>
      <LoginForm />
    </div>
  );
}
