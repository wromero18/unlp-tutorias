import path from "node:path";

/**
 * Resuelve DATABASE_URL a una ruta absoluta cuando es un archivo SQLite relativo.
 * El CLI de Prisma (`prisma migrate`) resuelve rutas "file:" relativas al
 * directorio de `schema.prisma` (prisma/), pero el runtime de PrismaClient
 * las resolvía relativas a process.cwd(), apuntando a un archivo .db distinto.
 * Por eso forzamos acá la misma convención que usa el CLI: relativo a prisma/.
 * En producción con PostgreSQL esto no aplica: se devuelve la URL tal cual.
 */
export function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";

  if (url.startsWith("file:") && !path.isAbsolute(url.slice("file:".length))) {
    const relativePath = url.slice("file:".length);
    return `file:${path.resolve(
      /* turbopackIgnore: true */ process.cwd(),
      "prisma",
      relativePath
    )}`;
  }

  return url;
}
