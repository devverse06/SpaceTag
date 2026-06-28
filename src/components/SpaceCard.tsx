import Link from "next/link";
import { getTopTags, type SpaceRecord } from "@/lib/types";
import { TagList } from "./TagList";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  PROCESSING: "bg-blue-50 text-blue-700",
  DONE: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700",
};

export function SpaceCard({ space }: { space: SpaceRecord }) {
  const topTags = getTopTags(space.annotations);

  return (
    <Link
      href={`/gallery/${space.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={space.imageUrl}
          alt="Analyzed space"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <span
          className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[space.status]}`}
        >
          {space.status.toLowerCase()}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        {topTags.length > 0 ? (
          <TagList tags={topTags} variant="compact" />
        ) : (
          <p className="text-sm text-stone-400">No tags yet</p>
        )}
        <p className="mt-auto text-xs text-stone-400">{formatDate(space.createdAt)}</p>
      </div>
    </Link>
  );
}
