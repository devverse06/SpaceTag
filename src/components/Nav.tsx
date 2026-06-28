import Link from "next/link";

const links = [
  { href: "/upload", label: "Upload" },
  { href: "/gallery", label: "Gallery" },
  { href: "/compare", label: "Compare" },
];

export function Nav({ active }: { active?: "upload" | "gallery" | "compare" }) {
  return (
    <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/upload" className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight text-stone-900">SpaceTag</span>
          <span className="hidden text-xs text-stone-400 sm:inline">AI room analysis</span>
        </Link>
        <nav className="flex gap-1">
          {links.map(({ href, label }) => {
            const key = href.slice(1) as "upload" | "gallery" | "compare";
            const isActive = active === key;
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-stone-900 text-white"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
