import Link from "next/link";

// Catches any path the middleware did not localize.
// The user is sent here only if the locale prefix was missing AND the
// middleware decided not to redirect. In practice we redirect to /en first.

export default function RootNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          background: "#0A0A0A",
          color: "#F5F0E8",
          fontFamily: "system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#E60013",
            }}
          >
            {"// 404 · NO SIGNAL"}
          </p>
          <h1 style={{ fontSize: "3rem", margin: "1rem 0", textTransform: "uppercase" }}>
            OFF THE MAP
          </h1>
          <p style={{ opacity: 0.7, marginBottom: "2rem" }}>
            The page you&apos;re looking for isn&apos;t on the grid.
          </p>
          <Link
            href="/en"
            style={{
              display: "inline-block",
              padding: "14px 28px",
              background: "#E60013",
              color: "#F5F0E8",
              textDecoration: "none",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Back to base
          </Link>
        </div>
      </body>
    </html>
  );
}
