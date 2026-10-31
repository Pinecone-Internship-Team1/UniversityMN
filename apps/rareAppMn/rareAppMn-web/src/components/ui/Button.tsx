import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * primary: the accent call to action. secondary: outlined. ghost: no frame.
 * danger: destructive actions. "solid" (ink fill), "outline" and "destructive"
 * are the older names, kept for the admin screens.
 */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "solid"
  | "outline"
  | "destructive";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonVariantProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const SECONDARY =
  "border border-ink/20 bg-card/60 text-ink hover:border-ink/50 hover:bg-card active:bg-ink/[0.06]";
const DANGER = "bg-destructive text-white hover:opacity-90 active:opacity-80";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-foreground shadow-[0_1px_0_rgb(0_0_0/0.08)] hover:bg-accent-strong active:bg-accent-strong",
  secondary: SECONDARY,
  outline: SECONDARY,
  ghost: "text-ink hover:bg-ink/[0.06] active:bg-ink/[0.1]",
  danger: DANGER,
  destructive: DANGER,
  solid: "bg-ink text-paper hover:bg-ink/85 active:bg-ink/80",
};

// Every size is at least 44px tall on touch screens.
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-11 px-4 text-[15px] gap-1.5 lg:h-10",
  md: "h-12 px-5 text-base gap-2",
  lg: "h-14 px-7 text-[17px] gap-2.5",
  icon: "h-11 w-11 p-0",
};

export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
}: ButtonVariantProps & { className?: string }) {
  return cn(
    "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-full font-bold transition-[background-color,border-color,color,opacity,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[1.1em] [&_svg]:shrink-0",
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
