import Link from "next/link";
import { contentRepository } from "../src/infrastructure/content-loader";
import { getWordFamilies } from "../src/infrastructure/word-formation-loader";

const sections = [
  {
    href: "/phrasal-verbs",
    name: "Phrasal verbs",
    count: contentRepository.getCards("phrasal-verbs").length,
  },
  {
    href: "/collocations",
    name: "Colocaciones",
    count: contentRepository.getCards("collocations").length,
  },
  {
    href: "/prepositions",
    name: "Preposiciones",
    count: contentRepository.getCards("prepositions").length,
  },
  {
    href: "/idioms",
    name: "Modismos y expresiones",
    count: contentRepository.getCards("idioms").length,
  },
  {
    href: "/word-formation",
    name: "Formación de palabras",
    count: getWordFamilies().length,
  },
];

export default function HomePage() {
  return (
    <main className="section-index">
      <h1>Practicá inglés</h1>
      <p>Elegí una sección para practicar con tarjetas.</p>
      <ul>
        {sections.map((section) => (
          <li key={section.href}>
            <Link href={section.href}>
              {section.name} ({section.count})
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
