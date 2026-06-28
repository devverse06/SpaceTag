export function TagList({
  tags,
  variant = "default",
}: {
  tags: string[];
  variant?: "default" | "compact" | "outline";
}) {
  if (tags.length === 0) return null;

  const styles = {
    default: "bg-stone-100 text-stone-700",
    compact: "bg-stone-50 text-stone-600 text-xs",
    outline: "border border-stone-200 bg-white text-stone-700",
  };

  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li
          key={tag}
          className={`rounded-full px-3 py-1 text-sm font-medium ${styles[variant]}`}
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}
