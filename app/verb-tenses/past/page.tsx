import Link from "next/link";
import { notFound } from "next/navigation";
import { getVerbTenseSection } from "../../../src/infrastructure/verb-tenses-loader";
import { VerbTensesSectionClient } from "../../components/VerbTensesSectionClient";
import { BackIcon } from "../../components/ui/BackIcon";

export default function PastPracticePage() {
  let section;
  try {
    section = getVerbTenseSection("past");
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
          <p>Grammar practice · Past</p>
          <h1>Past</h1>
          <p>
            Complete the gap with the right past form, then reveal the model
            answer and compare.
          </p>
        </header>
        <VerbTensesSectionClient
          exercises={section.exercises}
          pathname="/verb-tenses/past"
        />
      </div>
    </main>
  );
}
