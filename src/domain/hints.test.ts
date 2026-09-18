import { describe, expect, it } from "vitest";
import { resolveHint } from "./hints";

describe("resolveHint", () => {
  it("resolves a curated hint", () => {
    expect(resolveHint("give up", "phrasal-verb", "general")).toBe("give-up-flag");
  });

  it("falls back to the card type for unknown expressions", () => {
    expect(resolveHint("unknown expression", "idiom", "general")).toBe("fallback:idiom");
  });

  it("normalizes whitespace and casing before resolving a curated hint", () => {
    expect(resolveHint("  GIVE UP  ", "phrasal-verb", "general")).toBe("give-up-flag");
  });
});
