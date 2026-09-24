import Link from "next/link";
import { notFound } from "next/navigation";
import { getVerbTenseSection } from "../../../src/infrastructure/verb-tenses-loader";
import { VerbTensesPracticeClient } from "../../components/VerbTensesPracticeClient";
import { BackIcon } from "../../components/ui/BackIcon";

export default function ConditionalsPracticePage() {
  let section;
  try {
    section = getVerbTenseSection("conditionals");
  } catch {
    notFound();
  }
  if (!section) notFound();

  return (
    <main className="practice-layout" id="contenido">
      <div className="practice-layout__content">
        <header className="practice-header">
          <Link href="/" className="grammar-index__back">
            <BackIcon /> All sections
          </Link>
          <p>Grammar practice · Conditionals</p>
          <h1>Conditionals</h1>
          <p>
            Complete the gap with the right conditional form, then reveal the
            model answer and compare.
          </p>
        </header>
        <VerbTensesPracticeClient
          exercises={section.exercises}
          accent="var(--accent-grammar)"
        />
      </div>
    </main>
  );
}
