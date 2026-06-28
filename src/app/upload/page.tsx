"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { AnnotationPanel } from "@/components/AnnotationPanel";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Nav } from "@/components/Nav";
import { useSpacePolling } from "@/hooks/useSpacePolling";
import type { SpaceRecord } from "@/lib/types";

type UploadPhase = "idle" | "uploading" | "ready" | "analyzing" | "done" | "failed";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SpaceRecord | null>(null);

  const handlePollUpdate = useCallback((polledSpace: SpaceRecord) => {
    if (polledSpace.status === "DONE") {
      setResult(polledSpace);
      setPhase("done");
    } else if (polledSpace.status === "FAILED") {
      setResult(polledSpace);
      setPhase("failed");
      setError(polledSpace.errorMessage ?? "Analysis failed");
    }
  }, []);

  const handlePollError = useCallback((message: string) => {
    setError(message);
    setPhase("failed");
  }, []);

  const pollingEnabled = phase === "analyzing" && Boolean(spaceId);
  useSpacePolling(spaceId, pollingEnabled, handlePollUpdate, handlePollError);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setSpaceId(null);
    setResult(null);
    setError(null);
    setPhase("ready");
  };

  const uploadImage = useCallback(async () => {
    if (!file) return null;

    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/spaces", { method: "POST", body: formData });
    const data = (await response.json()) as SpaceRecord & { error?: string };

    if (!response.ok) {
      throw new Error(data.error ?? "Upload failed");
    }

    return data;
  }, [file]);

  const startAnalysis = useCallback(async () => {
    setError(null);

    try {
      let id = spaceId;

      if (!id) {
        setPhase("uploading");
        const uploaded = await uploadImage();
        if (!uploaded) return;
        id = uploaded.id;
        setSpaceId(id);
      }

      setPhase("analyzing");

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spaceId: id }),
      });

      const data = (await response.json()) as SpaceRecord & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to start analysis");
      }

      if (data.status === "DONE") {
        setResult(data);
        setPhase("done");
      } else if (data.status === "FAILED") {
        setResult(data);
        setPhase("failed");
        setError(data.errorMessage ?? "Analysis failed");
      }
    } catch (err) {
      setPhase("failed");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }, [spaceId, uploadImage]);

  const handleRetry = () => {
    setError(null);
    setPhase("ready");
    void startAnalysis();
  };

  const isBusy = phase === "uploading" || phase === "analyzing";

  return (
    <div className="min-h-full bg-stone-50">
      <Nav active="upload" />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Upload a space</h1>
          <p className="mt-1 text-stone-500">
            Upload a room photo and let AI tag furniture, materials, lighting, and colors.
          </p>
        </div>

        {error && phase === "failed" && (
          <div className="mb-6">
            <ErrorBanner message={error} onRetry={handleRetry} />
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <label
              htmlFor="image-upload"
              className={`flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                preview
                  ? "border-stone-200 bg-white p-2"
                  : "border-stone-300 bg-white hover:border-stone-400 hover:bg-stone-50"
              }`}
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Upload preview" className="h-full w-full rounded-lg object-cover" />
              ) : (
                <>
                  <span className="text-4xl text-stone-300">+</span>
                  <span className="mt-2 text-sm font-medium text-stone-600">Choose an image</span>
                  <span className="mt-1 text-xs text-stone-400">JPEG, PNG, or WebP · max 5 MB</span>
                </>
              )}
              <input
                id="image-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleFileChange}
                disabled={isBusy}
              />
            </label>

            <button
              type="button"
              onClick={() => void startAnalysis()}
              disabled={!file || isBusy}
              className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {phase === "uploading"
                ? "Uploading…"
                : phase === "analyzing"
                  ? "Analyzing…"
                  : "Analyze"}
            </button>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
              Analysis results
            </h2>

            {phase === "analyzing" && <LoadingSpinner label="AI is analyzing your space…" />}

            {phase === "done" && result?.annotations && (
              <div className="space-y-4">
                <AnnotationPanel annotations={result.annotations} />
                {result.errorMessage && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {result.errorMessage}
                  </p>
                )}
                <Link
                  href="/gallery"
                  className="inline-block text-sm font-medium text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
                >
                  View in gallery →
                </Link>
              </div>
            )}

            {phase !== "analyzing" && phase !== "done" && (
              <p className="text-sm text-stone-400">
                Tags will appear here after analysis — room type, furniture, materials, lighting, and
                colors.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
