// Sentry wrapper. No-op when NEXT_PUBLIC_SENTRY_DSN is unset.
// Usage:
//   import { captureException } from "@/lib/sentry";
//   try { ... } catch (err) { captureException(err); }

export function isSentryEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!isSentryEnabled()) {
    console.error("[error]", error, context ?? "");
    return;
  }
  // Lazy import — only loaded if DSN is configured.
  void import("@sentry/nextjs").then((Sentry) => {
    if (context) Sentry.setContext("extra", context);
    Sentry.captureException(error);
  });
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info"): void {
  if (!isSentryEnabled()) {
    console.log(`[${level}]`, message);
    return;
  }
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.captureMessage(message, level);
  });
}
