// @vitest-environment jsdom
// Verificación temporal de criterios de aceptación de SPEC 23 sobre los 26 temas reales.
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getGrammarTopics } from "../../../../src/infrastructure/grammar-loader";
import GrammarTopicPage from "./page";

afterEach(cleanup);

const topics = getGrammarTopics();
const norm = (text: string) => text.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();

// Une el texto de los nodos hijos con espacios (los párrafos/items se segmentan por oración).
function proseText(container: HTMLElement): string {
  const prose = container.querySelector(".grammar-theory__prose");
  if (!prose) return "";
  const parts: string[] = [];
  prose.querySelectorAll("p, li").forEach((node) => parts.push(node.textContent ?? ""));
  return norm(parts.join(" "));
}

describe("SPEC 23 acceptance — 26 real topics", () => {
  it("criterio 1: prosa EN en modo EN, sin rastro de ruleEs/usesEs/contrastsEs en el DOM", async () => {
    expect(topics).toHaveLength(26);
    for (const topic of topics) {
      const { container } = render(await GrammarTopicPage({
        params: Promise.resolve({ part: `parte-${topic.part}`, topic: topic.slug }),
      }));
      const text = proseText(container);
      expect(text, `${topic.title}: EN visible`).toContain(norm(topic.ruleEn));
      expect(text, `${topic.title}: uses EN`).toContain(norm(topic.usesEn));
      expect(text, `${topic.title}: contrasts EN`).toContain(norm(topic.contrastsEn));
      expect(text, `${topic.title}: ruleEs ausente`).not.toContain(norm(topic.ruleEs));
      expect(text, `${topic.title}: usesEs ausente`).not.toContain(norm(topic.usesEs));
      expect(text, `${topic.title}: contrastsEs ausente`).not.toContain(norm(topic.contrastsEs));
      cleanup();
    }
  });

  it("criterio 2: los seis encabezados están en inglés con el botón en EN y en ES", async () => {
    for (const topic of topics) {
      render(await GrammarTopicPage({
        params: Promise.resolve({ part: `parte-${topic.part}`, topic: topic.slug }),
      }));
      const headings = ["Theory", "Formation", "Rule", "When to use", "Watch out for this", "In context"];
      for (const name of headings) expect(screen.queryByRole("heading", { name }), `${topic.title}: ${name}`).not.toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Show Spanish theory" }));
      for (const name of headings) expect(screen.queryByRole("heading", { name }), `${topic.title} ES: ${name}`).not.toBeNull();
      cleanup();
    }
  });

  it("criterio 4: pulsar ES muestra la prosa ES, oculta la EN y actualiza el botón", async () => {
    for (const topic of topics) {
      const { container } = render(await GrammarTopicPage({
        params: Promise.resolve({ part: `parte-${topic.part}`, topic: topic.slug }),
      }));
      fireEvent.click(screen.getByRole("button", { name: "Show Spanish theory" }));
      const text = proseText(container);
      expect(text, `${topic.title}: ES visible`).toContain(norm(topic.ruleEs));
      expect(text, `${topic.title}: usesEs visible`).toContain(norm(topic.usesEs));
      expect(text, `${topic.title}: contrastsEs visible`).toContain(norm(topic.contrastsEs));
      expect(text, `${topic.title}: EN oculto`).not.toContain(norm(topic.ruleEn));
      expect(text, `${topic.title}: uses EN oculto`).not.toContain(norm(topic.usesEn));
      expect(text, `${topic.title}: contrasts EN oculto`).not.toContain(norm(topic.contrastsEn));
      const button = screen.getByRole("button", { name: "Show English theory" });
      expect(button.textContent).toBe("EN");
      expect(button.getAttribute("aria-pressed")).toBe("true");
      cleanup();
    }
  });

  it("criterio 5: pulsar EN restaura la prosa EN sin ES en el DOM", async () => {
    for (const topic of topics) {
      const { container } = render(await GrammarTopicPage({
        params: Promise.resolve({ part: `parte-${topic.part}`, topic: topic.slug }),
      }));
      const toggle = screen.getByRole("button", { name: "Show Spanish theory" });
      fireEvent.click(toggle);
      fireEvent.click(screen.getByRole("button", { name: "Show English theory" }));
      const text = proseText(container);
      expect(text, `${topic.title}: EN restaurado`).toContain(norm(topic.ruleEn));
      expect(text, `${topic.title}: ES oculto`).not.toContain(norm(topic.ruleEs));
      const button = screen.getByRole("button", { name: "Show Spanish theory" });
      expect(button.textContent).toBe("ES");
      expect(button.getAttribute("aria-pressed")).toBe("false");
      cleanup();
    }
  });

  it("criterio 6: navegar a otro tema remonta y resetea a inglés", async () => {
    const first = topics[0]!;
    const second = topics[1]!;
    const a = render(await GrammarTopicPage({
      params: Promise.resolve({ part: `parte-${first.part}`, topic: first.slug }),
    }));
    fireEvent.click(screen.getByRole("button", { name: "Show Spanish theory" }));
    a.unmount();
    const b = render(await GrammarTopicPage({
      params: Promise.resolve({ part: `parte-${second.part}`, topic: second.slug }),
    }));
    expect(screen.getByRole("button", { name: "Show Spanish theory" }).getAttribute("aria-pressed")).toBe("false");
    expect(proseText(b.container)).toContain(norm(second.ruleEn));
    expect(proseText(b.container)).not.toContain(norm(second.ruleEs));
  });

  it("criterio 7: los ejemplos EN+ES están siempre visibles en ambos modos", async () => {
    for (const topic of topics) {
      const { container } = render(await GrammarTopicPage({
        params: Promise.resolve({ part: `parte-${topic.part}`, topic: topic.slug }),
      }));
      const check = (mode: string) => {
        const list = container.querySelector(".grammar-theory__examples ul");
        expect(list, `${topic.title} ${mode}`).not.toBeNull();
        const items = within(list as HTMLElement).getAllByRole("listitem");
        expect(items, `${topic.title} ${mode}`).toHaveLength(topic.examples.length);
        for (const [index, example] of topic.examples.entries()) {
          expect(items[index]?.textContent, `${topic.title} ${mode} ex ${index}`).toContain(example.exampleEn);
          expect(items[index]?.textContent, `${topic.title} ${mode} tr ${index}`).toContain(example.translationEs);
        }
      };
      check("EN");
      fireEvent.click(screen.getByRole("button", { name: "Show Spanish theory" }));
      check("ES");
      cleanup();
    }
  });

  it("criterio 8: las tarjetas de práctica no cambian (EN consigna/modelo, ES tras Reveal)", async () => {
    const topic = topics[0]!;
    render(await GrammarTopicPage({
      params: Promise.resolve({ part: `parte-${topic.part}`, topic: topic.slug }),
    }));
    const first = topic.exercises[0]!;
    const practice = screen.getByRole("region", { name: "Practice" });
    const practiceText = () => norm(practice.textContent ?? "");
    expect(practiceText()).toContain(norm(first.promptEn));
    expect(practiceText()).not.toContain(norm(first.modelEn));
    expect(practiceText()).not.toContain(norm(first.explanationEs.replace(/\*/g, "")));
    expect(practiceText()).not.toContain(norm(first.translationEs));
    fireEvent.click(within(practice).getByRole("button", { name: "Reveal" }));
    expect(practiceText()).toContain(norm(first.modelEn));
    expect(practiceText()).toContain(norm(first.explanationEs.replace(/\*/g, "")));
    expect(practiceText()).toContain(norm(first.translationEs));
  });
});
