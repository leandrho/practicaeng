import Link from "next/link";
import { GRAMMAR_PARTS } from "../src/domain/grammar-catalog";
import {
  MIXED_SECTIONS,
  contentRepository,
} from "../src/infrastructure/content-loader";
import { getVerbTenseSection } from "../src/infrastructure/verb-tenses-loader";
import { getWordFamilies } from "../src/infrastructure/word-formation-loader";

// Los archivos de data/ se editan independientemente del código: la portada
// debe leer sus conteos actuales en cada solicitud, también en producción.
export const dynamic = "force-dynamic";

export default function HomePage() {
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
    {
      href: "/connectors",
      name: "Connectors",
      detail: "Link ideas: contrast, cause, result",
      count: contentRepository.getCards("connectors").length,
      unit: "cards",
      accent: "var(--accent-connectors)",
    },
  ];

  const total = sections
    .filter((section) => section.unit === "cards")
    .reduce((sum, section) => sum + section.count, 0);
  const familyCount = getWordFamilies().length;

  // Mixed Practice usa MIXED_SECTIONS: los conectores quedan fuera (SPEC 24).
  const mixedCount = MIXED_SECTIONS.reduce(
    (sum, section) => sum + contentRepository.getCards(section).length,
    0
  );

  const mixedCard = {
    href: "/mixed",
    name: "Mixed Practice",
    detail: "All sections shuffled",
    count: mixedCount,
    unit: "cards",
    accent: "var(--accent-mixed)",
  };

  const practiceSections = [...sections, mixedCard];

  const grammarTopicCount = GRAMMAR_PARTS.reduce(
    (sum, part) => sum + part.topics.length,
    0
  );

  const theorySections = [
    {
      href: "/grammar",
      name: "Grammar B1+",
      detail: "Grammar by topic, with guided practice",
      count: grammarTopicCount,
      unit: "topics",
      accent: "var(--accent-grammar)",
    },
  ];

  // SPEC 31 · tercer grupo Grammar practice: práctica pura de tiempos
  // verbales. No suma tarjetas de vocabulario ni entra en Mixed Practice.
  const presentCount = getVerbTenseSection("present").exercises.length;
  const pastCount = getVerbTenseSection("past").exercises.length;
  const futureCount = getVerbTenseSection("future").exercises.length;
  const conditionalsCount = getVerbTenseSection("conditionals").exercises.length;

  const grammarPracticeSections = [
    {
      href: "/verb-tenses/present",
      name: "Present",
      detail: "Present tenses gap-fill + reveal",
      count: presentCount,
      unit: "exercises",
      accent: "var(--accent-grammar)",
    },
    {
      href: "/verb-tenses/past",
      name: "Past",
      detail: "Past tenses gap-fill + reveal",
      count: pastCount,
      unit: "exercises",
      accent: "var(--accent-grammar)",
    },
    {
      href: "/verb-tenses/future",
      name: "Future",
      detail: "Future forms gap-fill + reveal",
      count: futureCount,
      unit: "exercises",
      accent: "var(--accent-grammar)",
    },
    {
      href: "/verb-tenses/conditionals",
      name: "Conditionals",
      detail: "Conditional forms gap-fill + reveal",
      count: conditionalsCount,
      unit: "exercises",
      accent: "var(--accent-grammar)",
    },
  ];

  return (
    <main className="home" id="contenido">
      <section className="home-hero" aria-labelledby="home-title">
        <h1 id="home-title">Practice English</h1>
        <p>
          Pick a section and practice with flashcards: see, recall, produce,
          reveal, compare, repeat.
        </p>
        <p className="home-hero__meta">
          {total} cards · {familyCount} families · {practiceSections.length}{" "}
          practice sections · {grammarTopicCount} grammar topics
        </p>
        <div
          className="session-bar"
          role="img"
          aria-label={`Card distribution by section, ${total} cards total`}
        >
          {sections
            .filter((section) => section.unit === "cards")
            .map((section) => (
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
      <section className="home-group" aria-labelledby="home-group-practice">
        <div className="home-group__heading">
          <h2 id="home-group-practice">Practice</h2>
          <span>{practiceSections.length} sections</span>
        </div>
        <p className="home-group__desc">
          Active recall: see, recall, produce, reveal, compare, repeat.
        </p>
        <ul className="section-grid">
          {practiceSections.map((section) => (
            <li key={section.href}>
              <Link
                className="section-card"
                style={
                  { "--card-accent": section.accent } as React.CSSProperties
                }
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
      </section>
      <section className="home-group" aria-labelledby="home-group-grammar-practice">
        <div className="home-group__heading">
          <h2 id="home-group-grammar-practice">Grammar practice</h2>
          <span>{grammarPracticeSections.length} sections</span>
        </div>
        <p className="home-group__desc">
          Pure practice: complete the gap, then reveal and compare.
        </p>
        <ul className="section-grid">
          {grammarPracticeSections.map((section) => (
            <li key={section.href}>
              <Link
                className="section-card"
                style={
                  { "--card-accent": section.accent } as React.CSSProperties
                }
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
      </section>
      <section className="home-group" aria-labelledby="home-group-theory">
        <div className="home-group__heading">
          <h2 id="home-group-theory">Grammar &amp; theory</h2>
          <span>{grammarTopicCount} topics</span>
        </div>
        <p className="home-group__desc">
          Review the rules, then practise by making your own sentences.
        </p>
        <ul className="section-grid">
          {theorySections.map((section) => (
            <li key={section.href}>
              <Link
                className="section-card"
                style={
                  { "--card-accent": section.accent } as React.CSSProperties
                }
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
      </section>
    </main>
  );
}
