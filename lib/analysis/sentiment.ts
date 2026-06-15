export type NewsSentiment = "POSITIVE" | "NEGATIVE" | "NEUTRAL";

const positiveKeywords = [
  "wins contract",
  "strong earnings",
  "profit growth",
  "upgrade",
  "buy rating",
  "expansion",
  "partnership",
  "acquisition",
  "record revenue"
];

const negativeKeywords = [
  "downgrade",
  "fraud",
  "investigation",
  "loss",
  "profit decline",
  "resignation",
  "lawsuit",
  "penalty",
  "warning"
];

export function scoreSentiment(title: string, summary = ""): NewsSentiment {
  const text = `${title} ${summary}`.toLowerCase();
  const positiveScore = positiveKeywords.filter((keyword) => text.includes(keyword)).length;
  const negativeScore = negativeKeywords.filter((keyword) => text.includes(keyword)).length;

  if (positiveScore > negativeScore) {
    return "POSITIVE";
  }

  if (negativeScore > positiveScore) {
    return "NEGATIVE";
  }

  return "NEUTRAL";
}

export const sentimentKeywords = {
  positive: positiveKeywords,
  negative: negativeKeywords
};
