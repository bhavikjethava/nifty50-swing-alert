import { describe, expect, it } from "vitest";
import { buildAlertMessage } from "@/lib/scanners/alerts";

describe("buildAlertMessage", () => {
  it("states that the signal is informational only", () => {
    const message = buildAlertMessage({
      symbol: "TCS.NS",
      signal: "BULLISH",
      price: 4250,
      reasons: ["EMA20 > EMA50 > EMA200", "Volume above 1.5x 20-day average"],
      newsTitle: "TCS wins contract with global insurer",
      sentiment: "POSITIVE"
    });

    expect(message).toContain("NIFTY50 SWING ALERT");
    expect(message).toContain("TCS");
    expect(message).toContain("informational only");
  });
});
