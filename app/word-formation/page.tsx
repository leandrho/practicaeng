import { filterCards, type Filter } from "../../src/application/filterCards";
import { getWordFamilies } from "../../src/infrastructure/word-formation-loader";
import { RegisterPracticeFilters } from "../components/FilterDrawerProvider";
import WordFormationClient from "../components/WordFormationClient";

const families = getWordFamilies();

export default async function WordFormationPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string | string[]; category?: string | string[] }>;
}) {
  const query = await searchParams;
  const filter: Filter = {
    level: typeof query.level === "string" ? query.level : undefined,
    category: typeof query.category === "string" ? query.category : undefined,
  };

  return (
    <main className="practice-layout" id="contenido">
      <div className="practice-layout__content">
        <RegisterPracticeFilters cards={families} filter={filter} pathname="/word-formation" />
        <WordFormationClient
          clearFiltersPath="/word-formation"
          families={filterCards(families, filter)}
          accent="var(--accent-word-formation)"
          key={`${filter.level ?? ""}:${filter.category ?? ""}`}
        />
      </div>
    </main>
  );
}
