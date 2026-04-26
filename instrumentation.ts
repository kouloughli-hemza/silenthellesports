// Next.js instrumentation hook — runs once per process at startup.
// Initializes Sentry (Node + Edge) only if NEXT_PUBLIC_SENTRY_DSN is set.

export async function register() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export async function onRequestError(
  err: unknown,
  request: { path: string; method: string; headers: Record<string, string | string[] | undefined> },
  context: { routerKind: string; routePath: string; routeType: string },
) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.error("[onRequestError]", err, request.path, context.routePath);
    return;
  }
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(err, request, context);
}
