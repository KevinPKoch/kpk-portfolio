"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export default function UnlockClient({ next }: { next: string }) {
  const router = useRouter();

  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-(--text-faint)">
          Access required
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-(--text-strong)">
          Protected Case Study
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-(--text-muted)">
          This case study contains anonymized NDA material.
          <br />
          Enter the password to continue.
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-(--border) bg-(--surface) p-6 shadow-[0_16px_50px_rgba(0,0,0,0.10)]">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setLoading(true);

            const formData = new FormData(e.currentTarget);
            const password = String(formData.get("password") ?? "");

            const res = await fetch("/work/unlock/action", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ password }),
            });

            if (!res.ok) {
              setError("Access denied");
              setLoading(false);
              return;
            }

            // cookie is set by the route handler; now go to the original target
            router.replace(next);
            router.refresh();
          }}
          className="space-y-5"
        >
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-(--text-strong)">Password</span>

            <div className="relative">
              <input
                type={show ? "text" : "password"}
                name="password"
                placeholder="Enter password"
                required
                autoFocus
                onChange={() => error && setError(null)}
                className={cx(
                  "w-full rounded-xl border px-4 py-3 pr-14 text-sm outline-none transition",
                  "border-(--border) bg-(--bg) text-(--text)",
                  "placeholder:text-(--text-faint)",
                  "focus:border-gray-300 dark:focus:border-white/25",
                  "focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
                )}
              />

              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className={cx(
                  "absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-2 text-xs font-medium transition",
                  "text-(--text-muted) hover:text-(--accent)",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/20"
                )}
              >
                {show ? "Hide" : "Show"}
              </button>
            </div>

            {error && (
              <div className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}
          </label>

          <button
            type="submit"
            disabled={loading}
            className={cx(
              "group inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition",
              "bg-(--accent) text-(--bg) dark:bg-(--accent-primary) dark:text-black",
              "hover:opacity-95",
              "disabled:cursor-not-allowed disabled:opacity-60",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/20 focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
            )}
          >
            {loading ? "Checking…" : "Unlock"}
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </button>

          <div className="rounded-xl border border-(--border) bg-(--surface-subtle) p-4">
            <p className="text-sm font-medium text-(--text-strong)">Note</p>
            <p className="mt-1 text-sm leading-relaxed text-(--text-muted)">
              This case study focuses on the thinking and design decisions behind the work. Certain details are intentionally left out to respect confidentiality.
            </p>
          </div>
        </form>
      </div>

      {/* Local links */}
      <div className="mt-6 flex items-center justify-between text-sm">
        <Link href="/" className="text-(--text-muted) transition hover:text-(--accent)">
          ← Back to home
        </Link>

        <a
          href="mailto:hello@kevinpkoch.com"
          className="text-(--text-muted) transition hover:text-(--accent)"
        >
          Request access
        </a>
      </div>
    </>
  );
}
