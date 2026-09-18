import { notFound } from "next/navigation";
import {
  CONTENT_SECTIONS,
  contentRepository,
  type ContentSection,
} from "../../src/infrastructure/content-loader";
import { filterCards, type Filter } from "../../src/application/filterCards";
import { Flashcard } from "../components/Flashcard";
import { RegisterPracticeFilters } from "../components/FilterDrawerProvider";

export const dynamicParams = false;

const SECTION_ACCENTS: Record<ContentSection, string> = {
  "phrasal-verbs": "var(--accent-phrasal)",
  collocations: "var(--accent-collocations)",
  prepositions: "var(--accent-prepositions)",
  idioms: "var(--accent-idioms)",
};

export function generateStaticParams() {
  return CONTENT_SECTIONS.map((section) => ({ section }));
}

function isContentSection(section: string): section is ContentSection {
  return CONTENT_SECTIONS.includes(section as ContentSection);
}

export default async function SectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ level?: string | string[]; category?: string | string[] }>;
}) {
  const [{ section }, query] = await Promise.all([params, searchParams]);

  if (!isContentSection(section)) {
    notFound();
  }

  const cards = contentRepository.getCards(section);

  if (cards.length === 0) {
    notFound();
  }

  const filter: Filter = {
    level: typeof query.level === "string" ? query.level : undefined,
    category: typeof query.category === "string" ? query.category : undefined,
  };

  return (
    <main className="practice-layout" id="contenido">
      <div className="practice-layout__content">
        <RegisterPracticeFilters cards={cards} filter={filter} pathname={`/${section}`} />
        <Flashcard
          cards={filterCards(cards, filter)}
          clearFiltersPath={`/${section}`}
          accent={SECTION_ACCENTS[section]}
          key={`${filter.level ?? ""}:${filter.category ?? ""}`}
        />
      </div>
    </main>
  );
}
