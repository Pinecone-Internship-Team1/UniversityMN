import React from "react";

interface SectionLabelProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function SectionLabel({
  children,
  className = "",
  ...props
}: SectionLabelProps) {
  return (
    <p
      className={`inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-wider text-ink/60 select-none ${className}`}
      {...props}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
