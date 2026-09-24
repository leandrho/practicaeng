// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  isPracticeDialogOpen,
  shouldIgnorePracticeShortcut,
} from "./keyboard";

function keyEventOn(target: Element | Document | Window): KeyboardEvent {
  return { target } as unknown as KeyboardEvent;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("shouldIgnorePracticeShortcut", () => {
  it("allows shortcuts on non-interactive card content", () => {
    const section = document.createElement("section");
    section.innerHTML = "<h2>give up</h2><p>recall</p>";
    document.body.append(section);

    expect(shouldIgnorePracticeShortcut(keyEventOn(section))).toBe(false);
    expect(
      shouldIgnorePracticeShortcut(
        keyEventOn(section.querySelector("h2")!),
      ),
    ).toBe(false);
    expect(shouldIgnorePracticeShortcut(keyEventOn(document.body))).toBe(false);
  });

  it("ignores buttons, links, inputs, textareas and selects", () => {
    document.body.innerHTML = `
      <button>Reveal</button>
      <a href="/x">link</a>
      <input />
      <textarea></textarea>
      <select><option>a</option></select>
    `;
    for (const selector of ["button", "a", "input", "textarea", "select"]) {
      const el = document.querySelector(selector)!;
      expect(shouldIgnorePracticeShortcut(keyEventOn(el))).toBe(true);
    }
  });

  it("ignores nested targets inside controls and editable content", () => {
    document.body.innerHTML = `
      <button><span id="inner">Reveal</span></button>
      <div id="editable" contenteditable="true">edit me</div>
    `;
    expect(
      shouldIgnorePracticeShortcut(
        keyEventOn(document.querySelector("#inner")!),
      ),
    ).toBe(true);
    expect(
      shouldIgnorePracticeShortcut(
        keyEventOn(document.querySelector("#editable")!),
      ),
    ).toBe(true);
  });

  it("ignores events inside an open dialog", () => {
    document.body.innerHTML = `
      <div role="dialog" data-open="true"><p id="inside">filters</p></div>
    `;
    expect(
      shouldIgnorePracticeShortcut(
        keyEventOn(document.querySelector("#inside")!),
      ),
    ).toBe(true);
  });

  it("ignores card shortcuts while a filter dialog is open elsewhere", () => {
    document.body.innerHTML = `
      <section><h2>give up</h2></section>
      <div role="dialog" data-open="true"><button>Close</button></div>
    `;
    expect(
      shouldIgnorePracticeShortcut(
        keyEventOn(document.querySelector("h2")!),
      ),
    ).toBe(true);
    expect(isPracticeDialogOpen(document)).toBe(true);
  });

  it("allows shortcuts when the dialog is closed", () => {
    document.body.innerHTML = `
      <section><h2>give up</h2></section>
      <div role="dialog" data-open="false"><button>Close</button></div>
    `;
    expect(
      shouldIgnorePracticeShortcut(
        keyEventOn(document.querySelector("h2")!),
      ),
    ).toBe(false);
    expect(isPracticeDialogOpen(document)).toBe(false);
  });
});
