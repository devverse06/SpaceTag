export function LoadingSpinner({ label = "Analyzing…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-stone-800"
        aria-hidden
      />
      <p className="text-sm text-stone-500">{label}</p>
    </div>
  );
}
