import { PrismaClient } from "@prisma/client";
import { resolveDatabaseUrl } from "./db-url";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const databaseUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: databaseUrl });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Con SQLite, varias escrituras al mismo tiempo (ej. dos registros
// simultáneos) pueden fallar con "database is locked". WAL permite lecturas
// concurrentes con una escritura en curso, y busy_timeout hace que Prisma
// espere unos segundos en vez de fallar al toque si igual hay un choque de
// escrituras. No aplica a PostgreSQL (ver README para pasar a producción).
if (databaseUrl.startsWith("file:") && !globalForPrisma.prisma) {
  // PRAGMA devuelve una fila de resultado, así que usamos $queryRawUnsafe
  // (no $executeRawUnsafe, que solo acepta comandos sin resultado).
  prisma
    .$queryRawUnsafe("PRAGMA journal_mode = WAL;")
    .then(() => prisma.$queryRawUnsafe("PRAGMA busy_timeout = 5000;"))
    .catch((error) => {
      console.error("No se pudieron aplicar los PRAGMA de SQLite:", error);
    });
}
