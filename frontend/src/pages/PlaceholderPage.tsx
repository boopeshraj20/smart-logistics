interface PlaceholderPageProps {
  title: string;
}

/** Temporary page during scaffolding - replaced by real feature pages. */
export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <div className="glass-strong px-10 py-8 text-center">
        <h1 className="text-xl font-semibold text-ink">{title}</h1>
        <p className="mt-2 max-w-[38ch] text-sm text-ink-muted">
          Module scaffolding complete. The full experience arrives in the next phase.
        </p>
      </div>
    </div>
  );
}