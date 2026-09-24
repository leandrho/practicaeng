import Link from "next/link";
import { notFound } from "next/navigation";
import { getVerbTenseSection } from "../../../src/infrastructure/verb-tenses-loader";
import { VerbTensesSectionClient } from "../../components/VerbTensesSectionClient";
import { BackIcon } from "../../components/ui/BackIcon";

export default function FuturePracticePage() {
  let section;
  try {
    section = getVerbTenseSection("future");
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
          <p>Grammar practice · Future</p>
          <h1>Future</h1>
          <p>
            Complete the gap with the right future form, then reveal the model
            answer and compare.
          </p>
        </header>
        <VerbTensesSectionClient
          exercises={section.exercises}
          pathname="/verb-tenses/future"
        />
      </div>
    </main>
  );
}
