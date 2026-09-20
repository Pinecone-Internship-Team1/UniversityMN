export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
      <span className="h-px w-8 bg-accent" aria-hidden="true" />
      {children}
    </p>
  );
}
