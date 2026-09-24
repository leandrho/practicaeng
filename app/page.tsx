import Link from "next/link";
import { GRAMMAR_PARTS } from "../src/domain/grammar-catalog";
import {
  MIXED_SECTIONS,
  contentRepository,
} from "../src/infrastructure/content-loader";
import { getWordFamilies } from "../src/infrastructure/word-formation-loader";
import { HomeLocal } from "./components/HomeLocal";

// Los archivos de data/ se editan independientemente del código: la portada
// debe leer sus conteos actuales en cada solicitud, también en producción.
export const dynamic = "force-dynamic";

// Mixed Practice usa MIXED_SECTIONS: seis secciones de vocabulario
// (phrasal verbs, collocations, prepositions, idioms, irregular verbs y
// everyday phrases). Connectors, Word Formation y Grammar quedan fuera.
const MIXED_DESCRIPTION =
  "Phrasal verbs, collocations, prepositions, idioms, irregular verbs and everyday phrases, shuffled.";

export default function HomePage() {
  const vocabularySections = [
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

  const familyCount = getWordFamilies().length;

  const mixedCount = MIXED_SECTIONS.reduce(
    (sum, section) => sum + contentRepository.getCards(section).length,
    0,
  );

  const grammarTopicCount = GRAMMAR_PARTS.reduce(
    (sum, part) => sum + part.topics.length,
    0,
  );

  const guidedPaths = [
    {
      href: "/mixed",
      name: "Mixed Practice",
      detail: MIXED_DESCRIPTION,
      count: mixedCount,
      unit: "cards",
      accent: "var(--accent-mixed)",
    },
    {
      href: "/grammar",
      name: "Grammar B1+",
      detail: "Grammar by topic, with guided practice",
      count: grammarTopicCount,
      unit: "topics",
      accent: "var(--accent-grammar)",
    },
    {
      href: "/word-formation",
      name: "Word Formation",
      detail: "Complete and produce word families",
      count: familyCount,
      unit: "families",
      accent: "var(--accent-word-formation)",
    },
  ];

  return (
    <main className="home" id="contenido">
      <section className="home-hero" aria-labelledby="home-title">
        <h1 id="home-title">Practice English</h1>
        <p>Start a 10-card session or pick a section.</p>
        <div className="home-hero__actions">
          <Link className="btn btn--primary" href="/mixed">
            Practice 10 cards
          </Link>
        </div>
        <HomeLocal />
        <p className="home-hero__meta">
          {mixedCount} mixed cards · {familyCount} families ·{" "}
          {grammarTopicCount} grammar topics
        </p>
      </section>
      <section className="home-group" aria-labelledby="home-group-path">
        <div className="home-group__heading">
          <h2 id="home-group-path">Choose a path</h2>
          <span>3 guided options</span>
        </div>
        <ul className="section-grid">
          {guidedPaths.map((section) => (
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
      <section className="home-group" aria-labelledby="home-group-vocabulary">
        <div className="home-group__heading">
          <h2 id="home-group-vocabulary">Browse vocabulary</h2>
          <span>{vocabularySections.length} sections</span>
        </div>
        <ul className="section-grid">
          {vocabularySections.map((section) => (
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
