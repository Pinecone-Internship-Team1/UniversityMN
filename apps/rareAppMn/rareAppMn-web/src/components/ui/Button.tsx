import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "solid" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonVariantProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  solid:
    "bg-ink text-paper hover:bg-accent disabled:hover:bg-ink dark:bg-ink dark:text-paper",
  outline:
    "border border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-paper disabled:hover:border-ink/20 disabled:hover:bg-transparent disabled:hover:text-ink",
  ghost: "text-ink hover:bg-ink/[0.06] disabled:hover:bg-transparent",
  destructive:
    "bg-destructive text-white hover:opacity-90 disabled:hover:opacity-100",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-3.5 text-[11px] gap-1.5",
  md: "h-10 px-5 text-[12px] gap-2",
  lg: "h-12 px-6 text-[13px] gap-2",
  icon: "h-10 w-10 p-0",
};

export function buttonClassName({
  variant = "solid",
  size = "md",
  className,
}: ButtonVariantProps & { className?: string }) {
  return cn(
    "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full font-semibold uppercase tracking-wider transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  );
}

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonClassName({ variant, size, className })}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
