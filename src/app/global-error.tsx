"use client";

/** Last-resort boundary for errors in the root layout itself. */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#f7f4ee", fontFamily: "system-ui, sans-serif", color: "#142033" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
          <div style={{ maxWidth: 460, background: "#fff", borderRadius: 24, padding: 40, textAlign: "center" }}>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 32, color: "#0b1a2e", margin: 0 }}>Something went wrong</h1>
            <p style={{ color: "#5d6878", lineHeight: 1.6, marginTop: 12 }}>
              We couldn’t load Adept right now. Please check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => retry()}
              style={{ marginTop: 24, height: 44, padding: "0 24px", borderRadius: 999, background: "#0b1a2e", color: "#fff", border: 0, fontSize: 15, cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
