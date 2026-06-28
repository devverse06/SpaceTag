import Link from "next/link";
import { notFound } from "next/navigation";
import { AnnotationPanel } from "@/components/AnnotationPanel";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Nav } from "@/components/Nav";
import { prisma } from "@/lib/prisma";
import { toSpaceRecord } from "@/lib/spaces";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default async function GalleryDetailPage({ params }: PageProps) {
  const { id } = await params;

  let space;
  try {
    space = await prisma.space.findUnique({ where: { id } });
  } catch {
    return (
      <div className="min-h-full bg-stone-50">
        <Nav active="gallery" />
        <main className="mx-auto max-w-4xl px-6 py-10">
          <ErrorBanner message="Could not load this space. Check your database connection." />
        </main>
      </div>
    );
  }

  if (!space) notFound();

  const record = toSpaceRecord(space);

  return (
    <div className="min-h-full bg-stone-50">
      <Nav active="gallery" />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/gallery"
          className="mb-6 inline-block text-sm text-stone-500 hover:text-stone-900"
        >
          ← Back to gallery
        </Link>

        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="aspect-[16/10] bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={record.imageUrl}
              alt="Analyzed space"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-stone-400">Analyzed {formatDate(record.createdAt)}</p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  record.status === "DONE"
                    ? "bg-emerald-50 text-emerald-700"
                    : record.status === "FAILED"
                      ? "bg-red-50 text-red-700"
                      : "bg-stone-100 text-stone-600"
                }`}
              >
                {record.status.toLowerCase()}
              </span>
            </div>

            {record.status === "FAILED" && record.errorMessage && (
              <div className="mb-6">
                <ErrorBanner message={record.errorMessage} />
              </div>
            )}

            {record.annotations ? (
              <AnnotationPanel annotations={record.annotations} />
            ) : (
              <p className="text-sm text-stone-400">
                {record.status === "PROCESSING" || record.status === "PENDING"
                  ? "Analysis in progress…"
                  : "No annotations available."}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
