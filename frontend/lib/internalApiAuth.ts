/**
 * When INTERNAL_API_SECRET is set, protected routes require:
 *   Authorization: Bearer <secret>
 * or
 *   X-Internal-Key: <secret>
 *
 * If unset, returns null (caller may allow open access — e.g. local demo).
 */
export function unauthorizedIfInternalSecretMismatch(
  request: Request,
): Response | null {
  const secret = process.env.INTERNAL_API_SECRET?.trim();
  if (!secret) return null;

  const auth = request.headers.get("authorization");
  const key = request.headers.get("x-internal-key");
  const token =
    auth?.replace(/^Bearer\s+/i, "").trim() || key?.trim() || "";

  if (token !== secret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return null;
}

/**
 * For cron + manual runs: allow when either `CRON_SECRET` (Vercel Cron sends `Authorization: Bearer`) or `INTERNAL_API_SECRET` matches.
 * If neither env var is set, allows (local dev).
 */
export function unauthorizedIfCronOrInternalMismatch(
  request: Request,
): Response | null {
  const cron = process.env.CRON_SECRET?.trim();
  const internal = process.env.INTERNAL_API_SECRET?.trim();
  const auth = request.headers.get("authorization");
  const key = request.headers.get("x-internal-key");
  const token =
    auth?.replace(/^Bearer\s+/i, "").trim() || key?.trim() || "";

  if (!cron && !internal) return null;

  if (cron && token === cron) return null;
  if (internal && token === internal) return null;

  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
