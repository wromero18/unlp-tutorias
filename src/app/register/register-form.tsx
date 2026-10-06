"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type Subject = { id: string; name: string };
type Career = { id: string; name: string; subjects: Subject[] };
type Role = "STUDENT" | "TUTOR";

export function RegisterForm({ careers }: { careers: Career[] }) {
  const router = useRouter();
  const [role, setRole] = useState<Role>("STUDENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [careerId, setCareerId] = useState(careers[0]?.id ?? "");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleSubject(id: string) {
    setSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          username,
          password,
          role,
          careerId: role === "STUDENT" ? careerId : undefined,
          subjectIds: role === "TUTOR" ? subjectIds : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudo crear la cuenta.");
        setLoading(false);
        return;
      }

      const signInResult = await signIn("credentials", {
        identifier: email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Ocurrió un error. Intentá de nuevo.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <RoleButton
          label="Soy alumno"
          active={role === "STUDENT"}
          onClick={() => setRole("STUDENT")}
        />
        <RoleButton
          label="Soy tutor"
          active={role === "TUTOR"}
          onClick={() => setRole("TUTOR")}
        />
      </div>

      <Field label="Nombre completo">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder="Ana Pérez"
        />
      </Field>

      <Field label="Email">
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          placeholder="ana@alu.unlp.edu.ar"
        />
      </Field>

      <Field label="Usuario">
        <input
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input"
          placeholder="anaperez"
          pattern="[a-zA-Z0-9_.]{3,20}"
          title="3 a 20 caracteres: letras, números, punto o guión bajo"
        />
      </Field>

      <Field label="Contraseña">
        <input
          required
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          placeholder="Mínimo 8 caracteres"
        />
      </Field>

      {role === "STUDENT" ? (
        <Field label="Carrera">
          <select
            required
            value={careerId}
            onChange={(e) => setCareerId(e.target.value)}
            className="input"
          >
            {careers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <Field label="Materias en las que das tutorías">
          <div className="flex flex-col gap-3 border border-subtle rounded-md p-3 max-h-64 overflow-y-auto">
            {careers.map((c) => (
              <div key={c.id}>
                <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-1.5">
                  {c.name}
                </p>
                <div className="flex flex-col gap-1.5">
                  {c.subjects.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={subjectIds.includes(s.id)}
                        onChange={() => toggleSubject(s.id)}
                      />
                      {s.name}
                    </label>
                  ))}
                  {c.subjects.length === 0 && (
                    <p className="text-xs text-secondary">
                      Todavía no hay materias cargadas.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Field>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary mt-2">
        {loading ? "Creando cuenta…" : "Crear cuenta"}
      </button>
    </form>
  );
}

function RoleButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? "pill-active" : "pill"}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
