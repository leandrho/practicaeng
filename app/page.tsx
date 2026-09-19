import Link from "next/link";
import { contentRepository } from "../src/infrastructure/content-loader";
import { getWordFamilies } from "../src/infrastructure/word-formation-loader";

const sections = [
  {
    href: "/phrasal-verbs",
    name: "Phrasal verbs",
    detail: "Verbs with particles",
    count: contentRepository.getCards("phrasal-verbs").length,
    unit: "cards",
    accent: "var(--accent-phrasal)",
  },
  {
    href: "/collocations",
    name: "Collocations",
    detail: "Natural word combinations",
    count: contentRepository.getCards("collocations").length,
    unit: "cards",
    accent: "var(--accent-collocations)",
  },
  {
    href: "/prepositions",
    name: "Prepositions",
    detail: "Fixed prepositions",
    count: contentRepository.getCards("prepositions").length,
    unit: "cards",
    accent: "var(--accent-prepositions)",
  },
  {
    href: "/idioms",
    name: "Idioms & Expressions",
    detail: "Idiomatic expressions",
    count: contentRepository.getCards("idioms").length,
    unit: "cards",
    accent: "var(--accent-idioms)",
  },
  {
    href: "/irregular-verbs",
    name: "Irregular Verbs",
    detail: "Base, past and participle",
    count: contentRepository.getCards("irregular-verbs").length,
    unit: "cards",
    accent: "var(--accent-irregular-verbs)",
  },
  {
    href: "/word-formation",
    name: "Word Formation",
    detail: "Word families",
    count: getWordFamilies().length,
    unit: "families",
    accent: "var(--accent-word-formation)",
  },
  {
    href: "/everyday-phrases",
    name: "Everyday Phrases",
    detail: "Common phrases for daily situations",
    count: contentRepository.getCards("everyday-phrases").length,
    unit: "cards",
    accent: "var(--accent-everyday-phrases)",
  },
];

const total = sections.reduce((sum, section) => sum + section.count, 0);

const mixedCount = sections
  .filter((section) => section.unit === "cards")
  .reduce((sum, section) => sum + section.count, 0);

const gridSections = [
  ...sections,
  {
    href: "/mixed",
    name: "Mixed Practice",
    detail: "All sections shuffled",
    count: mixedCount,
    unit: "cards",
    accent: "var(--accent-mixed)",
  },
];

export default function HomePage() {
  return (
    <main className="home" id="contenido">
      <section className="home-hero" aria-labelledby="home-title">
        <h1 id="home-title">Practice English</h1>
        <p>
          Pick a section and practice with flashcards: see, recall, produce,
          reveal, compare, repeat.
        </p>
        <p className="home-hero__meta">
          {total} cards · {gridSections.length} sections
        </p>
        <div
          className="session-bar"
          role="img"
          aria-label={`Card distribution by section, ${total} total`}
        >
          {sections.map((section) => (
            <span
              key={section.href}
              style={{
                width: `${total === 0 ? 0 : (section.count / total) * 100}%`,
                background: section.accent,
              }}
            />
          ))}
        </div>
      </section>
      <ul className="section-grid">
        {gridSections.map((section) => (
          <li key={section.href}>
            <Link
              className="section-card"
              style={{ "--card-accent": section.accent } as React.CSSProperties}
              href={section.href}
              aria-label={`Practice ${section.name}, ${section.count} ${section.unit}`}
            >
              <span className="section-card__name">{section.name}</span>
              <span className="section-card__detail">{section.detail}</span>
              <span className="section-card__count">
                {section.count}{" "}
                <span className="section-card__unit">{section.unit}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
