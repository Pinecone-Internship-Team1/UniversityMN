import { ArrowRight } from "lucide-react";
import { buttonClassName } from "@/components/ui/Button";
import { INPUT_CLASSES } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

/**
 * «ЭЕШ оноогоо оруул»: a plain GET form to /schools?tab=majors&score=N, so it
 * works before (or without) JavaScript; the browser checks the 200–800 range.
 */
export function ScoreForm({ className }: { className?: string }) {
  return (
    <form
      action="/schools"
      method="get"
      className={cn("rounded-2xl border border-border-ink bg-card p-3 shadow-card sm:p-4", className)}
    >
      <input type="hidden" name="tab" value="majors" />
      <label htmlFor="hero-score" className="block px-1 text-[15px] font-bold text-ink">
        ЭЕШ оноогоо оруул
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="hero-score"
          name="score"
          type="number"
          inputMode="numeric"
          min={200}
          max={800}
          step={1}
          required
          placeholder="620"
          aria-describedby="hero-score-hint"
          className={cn(INPUT_CLASSES, "min-w-0 flex-1 text-lg font-bold tabular-nums")}
        />
        <button type="submit" className={buttonClassName({ variant: "solid", className: "px-4 max-[399px]:[&_svg]:hidden max-[359px]:text-[15px] sm:px-5" })}>
          Тохирох мэргэжлээ хар
          <ArrowRight />
        </button>
      </div>
      <p id="hero-score-hint" className="mt-2 px-1 text-sm leading-snug text-ink-3">
        Босго оноо нь элсэлтийн баталгаа биш. Эцсийн мэдээллийг сургуулийн сайтаас шалгаарай.
      </p>
    </form>
  );
}
