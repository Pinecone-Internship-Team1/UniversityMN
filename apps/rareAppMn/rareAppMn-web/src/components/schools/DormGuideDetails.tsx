import type { DormGuide } from "@/lib/graphql/types";

function GuideList({ title, items, ordered }: { title: string; items: string[]; ordered?: boolean }) {
  if (items.length === 0) return null;
  const List = ordered ? "ol" : "ul";
  return (
    <div>
      <h3 className="text-xs font-bold text-ink">{title}</h3>
      <List className={`mt-1.5 space-y-1 pl-4 ${ordered ? "list-decimal" : "list-disc"}`}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </List>
    </div>
  );
}

/** A university's dorm application guide: its caveat, then the steps and rules collapsed. */
export function DormGuideDetails({ guide }: { guide: DormGuide }) {
  const hasDetails =
    guide.steps.length > 0 ||
    guide.priorityOrder.length > 0 ||
    guide.documents.length > 0 ||
    guide.rules.length > 0 ||
    guide.links.length > 0 ||
    Boolean(guide.specialRooms);

  return (
    <div className="mt-4 space-y-3">
      {guide.note && <p className="text-[11px] leading-relaxed text-ink/50">{guide.note}</p>}
      {hasDetails && (
        <details className="rounded-xl border border-ink/10 bg-paper px-4 py-3">
          <summary className="cursor-pointer text-sm font-bold text-ink">
            Дотуур байранд хэрхэн орох вэ
          </summary>
          <div className="mt-3 space-y-4 text-xs leading-relaxed text-ink/70">
            {guide.steps.length > 0 && (
              <ol className="space-y-2">
                {guide.steps.map((step, index) => (
                  <li key={step.title}>
                    <span className="font-semibold text-ink">
                      {index + 1}. {step.title}.
                    </span>{" "}
                    {step.text}
                  </li>
                ))}
              </ol>
            )}
            <GuideList title="Давуу эрхийн дараалал" items={guide.priorityOrder} ordered />
            {guide.specialRooms && <p>{guide.specialRooms}</p>}
            <GuideList title="Бүрдүүлэх бичиг баримт" items={guide.documents} />
            <GuideList title="Анхаарах дүрэм" items={guide.rules} />
            {guide.links.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-ink">Журам, заавар</h3>
                <ul className="mt-1.5 space-y-1">
                  {guide.links.map((link) => (
                    <li key={link.url}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-accent hover:underline"
                      >
                        {link.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
