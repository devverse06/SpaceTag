import Link from "next/link";
import { Nav } from "@/components/Nav";
import { SpaceCard } from "@/components/SpaceCard";
import { prisma } from "@/lib/prisma";
import { toSpaceRecord } from "@/lib/spaces";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  let spaces: ReturnType<typeof toSpaceRecord>[] = [];
  let dbError = false;

  try {
    const records = await prisma.space.findMany({ orderBy: { createdAt: "desc" } });
    spaces = records.map(toSpaceRecord);
  } catch {
    dbError = true;
  }

  return (
    <div className="min-h-full bg-stone-50">
      <Nav active="gallery" />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Gallery</h1>
            <p className="mt-1 text-stone-500">All your analyzed spaces, saved and organized.</p>
          </div>
          <Link
            href="/upload"
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
          >
            Upload new
          </Link>
        </div>

        {dbError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Could not load spaces. Set DATABASE_URL and run{" "}
            <code className="rounded bg-red-100 px-1">npx prisma migrate dev</code>.
          </div>
        )}

        {!dbError && spaces.length === 0 && (
          <div className="rounded-xl border border-stone-200 bg-white px-6 py-16 text-center">
            <p className="text-stone-500">No spaces yet.</p>
            <Link
              href="/upload"
              className="mt-4 inline-block text-sm font-medium text-stone-900 underline-offset-2 hover:underline"
            >
              Upload your first room →
            </Link>
          </div>
        )}

        {spaces.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {spaces.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
