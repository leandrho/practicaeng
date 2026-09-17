import { getWordFamilies } from "../../src/infrastructure/word-formation-loader";
import WordFormationClient from "../components/WordFormationClient";

export const dynamic = "force-static";

const families = getWordFamilies();

export default function WordFormationPage() {
  return <WordFormationClient families={families} />;
}
