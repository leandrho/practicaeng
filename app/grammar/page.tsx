import Link from "next/link";
import { GRAMMAR_PARTS } from "../../src/domain/grammar-catalog";
import { BackIcon } from "../components/ui/BackIcon";

export default function GrammarPage() {
  return (
    <main className="home grammar-index" id="contenido">
      <header className="home-hero">
        <Link href="/" className="grammar-index__back"><BackIcon /> All sections</Link>
        <h1>Grammar B1+</h1>
        <p>Choose a topic. Review the rules, then practise by making your own sentences before you reveal the answer.</p>
        <p className="home-hero__meta">8 parts · 26 topics</p>
      </header>
      {GRAMMAR_PARTS.map((part) => (
        <section className="grammar-part" key={part.number} aria-labelledby={`grammar-part-${part.number}`}>
          <div className="grammar-part__heading">
            <h2 id={`grammar-part-${part.number}`}>Part {part.number}</h2>
            <span>{part.topics.length} topics</span>
          </div>
          <ul className="section-grid">
            {part.topics.map((topic, index) => (
              <li key={topic.slug}>
                <Link className="section-card grammar-topic-card" href={`/grammar/parte-${part.number}/${topic.slug}`}>
                  <span className="grammar-topic-card__number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <span className="section-card__name">{topic.title}</span>
                  <span className="section-card__detail">Study & practise →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
