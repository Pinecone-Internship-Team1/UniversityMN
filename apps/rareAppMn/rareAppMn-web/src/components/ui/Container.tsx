import type { ElementType, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /** "narrow" for reading-width pages (sign-in, legal, 404). */
  size?: "default" | "narrow";
}

/** The page width every section shares: 1200px max, 16px gutter on phones. */
export function Container({ as: Tag = "div", size = "default", className, ...props }: ContainerProps) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        size === "narrow" ? "max-w-3xl" : "max-w-[1200px]",
        className,
      )}
      {...props}
    />
  );
}
