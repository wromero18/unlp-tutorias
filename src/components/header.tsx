"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function Header() {
  const { data: session, status } = useSession();
  const isTutor = session?.user.role === "TUTOR";

  return (
    <header className="border-b border-subtle bg-surface">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold text-lg text-primary">
          UNLP Tutorías
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {!isTutor && (
            <Link href="/tutores" className="link-muted">
              Tutores
            </Link>
          )}
          {status === "authenticated" ? (
            <>
              {isTutor && <span className="chip">Tutor</span>}
              <Link href="/dashboard" className="link-muted">
                Mi panel
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-secondary">
                Cerrar sesión
              </button>
            </>
          ) : status === "loading" ? null : (
            <>
              <Link href="/login" className="link-muted">
                Iniciar sesión
              </Link>
              <Link href="/register" className="btn-primary">
                Registrarme
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
