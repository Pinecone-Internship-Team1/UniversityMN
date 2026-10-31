import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

// 16px text on every screen, so iOS never zooms in on focus.
export const INPUT_CLASSES =
  "flex h-12 w-full rounded-xl border border-ink/20 bg-card px-4 text-base text-ink placeholder:text-ink-3 outline-none transition-[border-color,box-shadow] duration-150 focus:border-accent focus:ring-[3px] focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return <input ref={ref} className={cn(INPUT_CLASSES, className)} {...props} />;
  },
);
Input.displayName = "Input";

export interface FieldProps {
  label: ReactNode;
  /** The id of the control inside, for the <label>. */
  htmlFor?: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** A visible label above a control, with an optional hint line below it. */
export function Field({ label, htmlFor, hint, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[15px] font-bold text-ink">
        {label}
      </label>
      {children}
      {hint && <p className="text-sm text-ink-3">{hint}</p>}
    </div>
  );
}
