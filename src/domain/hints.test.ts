import { describe, expect, it } from "vitest";
import { resolveHint } from "./hints";

describe("resolveHint", () => {
  it("resolves a curated hint", () => {
    expect(resolveHint("give up", "phrasal-verb", "general")).toBe("give-up-flag");
  });

  it("falls back to the card type for unknown expressions", () => {
    expect(resolveHint("unknown expression", "idiom", "general")).toBe("fallback:idiom");
    expect(resolveHint("unknown expression", "everyday-phrase", "general")).toBe(
      "fallback:everyday-phrase",
    );
  });

  it("falls back to fallback:connector for connector cards", () => {
    expect(resolveHint("moreover", "connector", "Adding information")).toBe(
      "fallback:connector",
    );
    expect(
      resolveHint("unknown connector", "connector", "Contrast and concession"),
    ).toBe("fallback:connector");
  });

  it("normalizes whitespace and casing before resolving a curated hint", () => {
    expect(resolveHint("  GIVE UP  ", "phrasal-verb", "general")).toBe("give-up-flag");
  });

  it("resolves a curated everyday phrase", () => {
    expect(resolveHint("How's it going?", "everyday-phrase", "Greetings & socializing")).toBe(
      "hows-it-going-conversation",
    );
  });
});
