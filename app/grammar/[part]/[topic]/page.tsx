import Link from "next/link";
import { notFound } from "next/navigation";
import { GRAMMAR_PARTS } from "../../../../src/domain/grammar-catalog";
import { getGrammarTopics } from "../../../../src/infrastructure/grammar-loader";
import { GrammarPracticeClient } from "../../../components/GrammarPracticeClient";

export const dynamicParams = false;

export function generateStaticParams() {
  return GRAMMAR_PARTS.flatMap((part) =>
    part.topics.map(({ slug }) => ({ part: `parte-${part.number}`, topic: slug })),
  );
}

function sentences(text: string): string[] {
  return Array.from(new Intl.Segmenter("es", { granularity: "sentence" }).segment(text),
    ({ segment }) => segment.trim()).filter(Boolean);
}

export default async function GrammarTopicPage({
  params,
}: {
  params: Promise<{ part: string; topic: string }>;
}) {
  const { part, topic: slug } = await params;
  const match = GRAMMAR_PARTS.find((entry) => `parte-${entry.number}` === part);
  if (!match || !match.topics.some((entry) => entry.slug === slug)) {
    notFound();
  }

  const topic = getGrammarTopics().find((entry) => entry.part === match.number && entry.slug === slug);
  if (!topic) notFound();

  return (
    <main className="practice-layout grammar-topic-page" id="contenido">
      <div className="practice-layout__content">
        <header className="practice-header">
          <Link className="grammar-index__back" href="/grammar">← All grammar topics</Link>
          <p>Parte {match.number} · Grammar B1+</p>
          <h1>{topic.title}</h1>
        </header>
        <article className="grammar-theory" aria-labelledby="grammar-theory-title">
          <header className="grammar-theory__header">
            <h2 id="grammar-theory-title">Theory</h2>
            <a href="#grammar-practice">Go to practice ↓</a>
          </header>
          <section className="grammar-theory__rule" aria-labelledby="grammar-rule-title">
            <h3 id="grammar-rule-title">Regla y forma</h3>
            {sentences(topic.ruleEs).map((sentence, index) => (
              <p key={index} className={index === 0 ? "grammar-theory__lead" : undefined} lang="es">{sentence}</p>
            ))}
          </section>
          <div className="grammar-theory__details">
            <section className="grammar-theory__uses" aria-labelledby="grammar-uses-title">
              <h3 id="grammar-uses-title">Cuándo se usa</h3>
              <ul lang="es">
                {sentences(topic.usesEs).map((sentence, index) => <li key={index}>{sentence}</li>)}
              </ul>
            </section>
            <section className="grammar-theory__traps" aria-labelledby="grammar-traps-title">
              <h3 id="grammar-traps-title">Ojo con esto</h3>
              <ul lang="es">
                {sentences(topic.contrastsEs).map((sentence, index) => <li key={index}>{sentence}</li>)}
              </ul>
            </section>
          </div>
          <section className="grammar-theory__examples" aria-labelledby="grammar-examples-title">
            <h3 id="grammar-examples-title">In context</h3>
            <ul>
              {topic.examples.map(({ exampleEn, translationEs }) => (
                <li key={exampleEn}>
                  <span lang="en">{exampleEn}</span>
                  <span lang="es">{translationEs}</span>
                </li>
              ))}
            </ul>
          </section>
        </article>
        <section className="grammar-practice-section" id="grammar-practice" aria-label="Practice">
          <h2>Practice · {topic.exercises.length} cards</h2>
          <GrammarPracticeClient exercises={topic.exercises} />
        </section>
      </div>
    </main>
  );
}
