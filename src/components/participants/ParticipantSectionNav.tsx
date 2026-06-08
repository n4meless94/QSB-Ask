import Link from "next/link";
import { BarChart3, MessageSquare } from "lucide-react";

type ParticipantSection = "qna" | "surveys";

type ParticipantSectionNavProps = {
  activeSection: ParticipantSection;
  joinCode: string;
  surveyCount?: number;
};

function sectionHref(joinCode: string, section: ParticipantSection) {
  return `/join/${joinCode}/${section}`;
}

function badgeCopy(count?: number) {
  if (!count || count < 1) return null;
  return count > 9 ? "9+" : String(count);
}

export function ParticipantSectionNav({
  activeSection,
  joinCode,
  surveyCount,
}: ParticipantSectionNavProps) {
  const surveyBadge = badgeCopy(surveyCount);
  const sections = [
    {
      href: sectionHref(joinCode, "qna"),
      icon: MessageSquare,
      id: "qna" as const,
      label: "Q&A",
    },
    {
      badge: surveyBadge,
      href: sectionHref(joinCode, "surveys"),
      icon: BarChart3,
      id: "surveys" as const,
      label: "Surveys",
    },
  ];

  return (
    <>
      <nav
        aria-label="Participant event sections"
        className="hidden w-fit max-w-full min-w-0 rounded-[16px] border border-slate-200 bg-white p-1 shadow-sm sm:inline-flex"
      >
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={[
                "relative inline-flex min-h-10 items-center gap-2 rounded-[12px] px-4 text-base font-semibold leading-6 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#008578] focus-visible:ring-offset-2",
                isActive
                  ? "bg-[#008578] !text-white shadow-sm hover:bg-[#00796B]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
              ].join(" ")}
              href={section.href}
              key={section.id}
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
              {section.label}
              {section.badge ? (
                <span
                  aria-hidden="true"
                  className={[
                    "ml-0.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold leading-none",
                    isActive ? "bg-white text-[#00796B]" : "bg-teal-50 text-[#00796B]",
                  ].join(" ")}
                >
                  {section.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <nav
        aria-label="Participant event sections"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_28px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden"
      >
        <div className="mx-auto grid max-w-[520px] grid-cols-2 gap-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={[
                  "relative inline-flex min-h-14 flex-col items-center justify-center gap-1 rounded-[12px] px-3 text-xs font-bold leading-[1.25] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#008578] focus-visible:ring-offset-2",
                  isActive
                    ? "bg-teal-50 text-[#00796B]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                ].join(" ")}
                href={section.href}
                key={section.id}
              >
                <span className="relative inline-flex">
                  <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={2.4} />
                  {section.badge ? (
                    <span
                      aria-hidden="true"
                      className="absolute -right-3 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#008578] px-1.5 text-[11px] font-bold leading-none text-white ring-2 ring-white"
                    >
                      {section.badge}
                    </span>
                  ) : null}
                </span>
                {section.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
