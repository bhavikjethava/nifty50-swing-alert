import { describe, expect, it } from "vitest";
import { scoreSentiment } from "@/lib/analysis/sentiment";

describe("scoreSentiment", () => {
  it("marks keyword-backed positive news", () => {
    expect(scoreSentiment("TCS wins contract with a global bank")).toBe("POSITIVE");
  });

  it("marks keyword-backed negative news", () => {
    expect(scoreSentiment("Infosys faces lawsuit after profit decline warning")).toBe("NEGATIVE");
  });

  it("keeps unrelated market coverage neutral", () => {
    expect(scoreSentiment("Nifty trades flat ahead of RBI commentary")).toBe("NEUTRAL");
  });
});
