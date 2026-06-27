'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10 text-white">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-white/70">Platform Error</p>
            <h1 className="text-2xl font-semibold">Something went wrong.</h1>
            <p className="mt-3 text-sm text-white/80">
              {error.message || 'An unexpected issue occurred while rendering this page.'}
            </p>
            {error.digest ? (
              <p className="mt-2 text-xs text-white/50">Error ID: {error.digest}</p>
            ) : null}
            <button
              className="mt-6 inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200"
              onClick={reset}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
