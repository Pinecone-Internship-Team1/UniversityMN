import Image from "next/image";
import { FaGithub } from "react-icons/fa";
import { useTranslations } from "next-intl";
import { Section, SectionHeader } from "@/components/ui/Section";

interface TeamMember {
  name: string;
  /** Key under "home.team.schools" (school names are spelled per language). */
  school: "school130" | "russian3" | "ulaanbaatar";
  role: string;
  image: string;
  github: string;
}

// Names and roles stay in English in both languages.
const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Erkhes",
    school: "school130",
    role: "Co-founder, Fullstack Developer",
    image: "/team/erkhes.jpg",
    github: "https://github.com/erkhes9632",
  },
  {
    name: "Zelme",
    school: "russian3",
    role: "Co-founder, Fullstack Developer",
    image: "/team/zelme.jpg",
    github: "https://github.com/zetsu19",
  },
  {
    name: "Ikhbayar",
    school: "ulaanbaatar",
    role: "Researcher, Frontend Developer",
    image: "/team/ikhbayar.jpg",
    github: "https://github.com/bikhbayar01-sudo",
  },
];

/** Our story and the team behind it (the footer's «Бидний тухай» and «Манай баг» land here). */
export function TeamSection() {
  const t = useTranslations("home.team");
  return (
    <Section id="about">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeader eyebrow={t("eyebrow")} title={t("title")} />
          <div className="mt-5 max-w-xl space-y-4 text-base leading-relaxed text-ink-2 md:text-lg">
            <p>{t("story1")}</p>
            <p>{t("story2")}</p>
          </div>
        </div>

        <div id="team" className="scroll-mt-24">
          <h3 className="font-display text-lg font-bold tracking-tight text-ink">
            {t("teamTitle")}
          </h3>
          <ul className="mt-4 space-y-3">
            {TEAM_MEMBERS.map((member) => (
              <li
                key={member.name}
                className="reveal flex items-center gap-4 rounded-2xl border border-border-ink bg-card p-4"
              >
                <Image
                  src={member.image}
                  alt={member.name}
                  width={64}
                  height={64}
                  sizes="64px"
                  className="h-16 w-16 shrink-0 rounded-full object-cover object-top"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-ink">{member.name}</p>
                  <p className="text-[15px] leading-snug text-ink-2">
                    {member.role}
                  </p>
                  <p className="text-sm text-ink-3">{t(`schools.${member.school}`)}</p>
                </div>
                <a
                  href={member.github}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={t("github", { name: member.name })}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-ink/[0.06] hover:text-ink"
                >
                  <FaGithub className="h-5 w-5" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
