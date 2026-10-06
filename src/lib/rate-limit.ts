/**
 * Rate limiter simple en memoria (ventana fija) para frenar fuerza bruta y
 * registros masivos. Vive en la memoria del proceso: sirve para un único
 * servidor Node (como este proyecto), pero se resetea si el proceso
 * reinicia y NO se comparte entre instancias/serverless. Para producción
 * con más de un servidor, reemplazar por un store compartido (Redis /
 * Upstash) manteniendo la misma interfaz.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Limpieza periódica para no acumular entradas viejas indefinidamente.
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupIfDue() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * @returns `allowed: false` si se superó el límite, junto con los segundos
 * que faltan para poder reintentar.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  cleanupIfDue();

  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** IP del cliente a partir de los headers que pone el proxy/host delante de Next.js. */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
