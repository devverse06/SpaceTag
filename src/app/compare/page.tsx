"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnnotationPanel } from "@/components/AnnotationPanel";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Nav } from "@/components/Nav";
import { getTopTags, type SpaceRecord } from "@/lib/types";
import { TagList } from "@/components/TagList";

export default function ComparePage() {
  const [spaces, setSpaces] = useState<SpaceRecord[]>([]);
  const [selected, setSelected] = useState<[string | null, string | null]>([null, null]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/spaces");
        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? "Failed to load spaces");
        }
        const data = (await response.json()) as SpaceRecord[];
        setSpaces(data.filter((s) => s.status === "DONE" && s.annotations));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load spaces");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const left = spaces.find((s) => s.id === selected[0]) ?? null;
  const right = spaces.find((s) => s.id === selected[1]) ?? null;

  const handleSelect = (slot: 0 | 1, id: string) => {
    setSelected((prev) => {
      const next = [...prev] as [string | null, string | null];
      next[slot] = id === next[slot] ? null : id;
      return next;
    });
  };

  return (
    <div className="min-h-full bg-stone-50">
      <Nav active="compare" />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Compare spaces</h1>
          <p className="mt-1 text-stone-500">
            Select any two analyzed spaces to review tags side by side.
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorBanner message={error} />
          </div>
        )}

        {loading && <LoadingSpinner label="Loading spaces…" />}

        {!loading && !error && spaces.length < 2 && (
          <div className="rounded-xl border border-stone-200 bg-white px-6 py-16 text-center">
            <p className="text-stone-500">You need at least two analyzed spaces to compare.</p>
            <Link
              href="/upload"
              className="mt-4 inline-block text-sm font-medium text-stone-900 underline-offset-2 hover:underline"
            >
              Upload more spaces →
            </Link>
          </div>
        )}

        {!loading && spaces.length >= 2 && (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              {[0, 1].map((slot) => (
                <div key={slot} className="space-y-2">
                  <label htmlFor={`select-${slot}`} className="text-sm font-medium text-stone-700">
                    Space {slot + 1}
                  </label>
                  <select
                    id={`select-${slot}`}
                    value={selected[slot as 0 | 1] ?? ""}
                    onChange={(e) => handleSelect(slot as 0 | 1, e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900"
                  >
                    <option value="">Select a space…</option>
                    {spaces.map((space) => (
                      <option key={space.id} value={space.id} disabled={space.id === selected[1 - slot]}>
                        {getTopTags(space.annotations, 2).join(" · ") || space.id.slice(0, 8)}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {left && right && (
              <div className="grid gap-6 lg:grid-cols-2">
                {[left, right].map((space) => (
                  <div
                    key={space.id}
                    className="overflow-hidden rounded-xl border border-stone-200 bg-white"
                  >
                    <div className="aspect-[4/3] bg-stone-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={space.imageUrl}
                        alt="Compared space"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-5">
                      <TagList tags={getTopTags(space.annotations)} variant="compact" />
                      <div className="mt-5 border-t border-stone-100 pt-5">
                        {space.annotations && <AnnotationPanel annotations={space.annotations} />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(!left || !right) && (
              <p className="text-center text-sm text-stone-400">
                Pick two spaces above to start comparing.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
