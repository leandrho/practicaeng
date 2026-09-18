import Link from "next/link";
import { contentRepository } from "../src/infrastructure/content-loader";
import { getWordFamilies } from "../src/infrastructure/word-formation-loader";

const sections = [
  {
    href: "/phrasal-verbs",
    name: "Phrasal verbs",
    detail: "Verbos con partícula",
    count: contentRepository.getCards("phrasal-verbs").length,
    unit: "tarjetas",
    accent: "var(--accent-phrasal)",
  },
  {
    href: "/collocations",
    name: "Colocaciones",
    detail: "Combinaciones naturales",
    count: contentRepository.getCards("collocations").length,
    unit: "tarjetas",
    accent: "var(--accent-collocations)",
  },
  {
    href: "/prepositions",
    name: "Preposiciones",
    detail: "Preposiciones fijas",
    count: contentRepository.getCards("prepositions").length,
    unit: "tarjetas",
    accent: "var(--accent-prepositions)",
  },
  {
    href: "/idioms",
    name: "Modismos y expresiones",
    detail: "Expresiones idiomáticas",
    count: contentRepository.getCards("idioms").length,
    unit: "tarjetas",
    accent: "var(--accent-idioms)",
  },
  {
    href: "/word-formation",
    name: "Formación de palabras",
    detail: "Familias de palabras",
    count: getWordFamilies().length,
    unit: "familias",
    accent: "var(--accent-word-formation)",
  },
];

const total = sections.reduce((sum, section) => sum + section.count, 0);

export default function HomePage() {
  return (
    <main className="home" id="contenido">
      <section className="home-hero" aria-labelledby="home-title">
        <h1 id="home-title">Practicá inglés</h1>
        <p>
          Elegí una sección y practicá con tarjetas: ver, recordar, producir,
          revelar, comparar, repetir.
        </p>
        <p className="home-hero__meta">
          {total} tarjetas · {sections.length} secciones
        </p>
        <div
          className="session-bar"
          role="img"
          aria-label={`Distribución de tarjetas por sección, ${total} en total`}
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
        {sections.map((section) => (
          <li key={section.href}>
            <Link
              className="section-card"
              style={{ "--card-accent": section.accent } as React.CSSProperties}
              href={section.href}
              aria-label={`Practicar ${section.name}, ${section.count} ${section.unit}`}
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
