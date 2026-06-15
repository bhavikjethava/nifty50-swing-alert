import { XMLParser } from "fast-xml-parser";
import { scoreSentiment } from "@/lib/analysis/sentiment";

export type ParsedNewsItem = {
  title: string;
  source: string;
  url: string;
  summary?: string;
  publishedAt: Date;
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: ""
});

const sharedFeeds = [
  {
    source: "Economic Times Markets",
    url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms"
  },
  {
    source: "Moneycontrol Markets",
    url: "https://www.moneycontrol.com/rss/marketreports.xml"
  }
];

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function cleanText(value: unknown): string {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchFeed(url: string, fallbackSource: string): Promise<ParsedNewsItem[]> {
  const response = await fetch(url, {
    headers: { "User-Agent": "Nifty50SwingAlert/1.0" },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`RSS fetch failed for ${fallbackSource}: ${response.status}`);
  }

  const parsed = parser.parse(await response.text());
  const items = asArray(parsed?.rss?.channel?.item);

  return items
    .map((item) => {
      const title = cleanText(item.title);
      const summary = cleanText(item.description);
      const source = cleanText(item.source?.["#text"] ?? item.source ?? fallbackSource);
      const urlValue = cleanText(item.link ?? item.guid?.["#text"] ?? item.guid);
      const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

      return {
        title,
        source,
        url: urlValue,
        summary,
        publishedAt,
        sentiment: scoreSentiment(title, summary)
      };
    })
    .filter((item) => item.title && item.url && Number.isFinite(item.publishedAt.getTime()));
}

export async function fetchStockNews(stockName: string): Promise<ParsedNewsItem[]> {
  const stockQuery = encodeURIComponent(`${stockName} NSE`);
  const feeds = [
    ...sharedFeeds,
    {
      source: "Google News",
      url: `https://news.google.com/rss/search?q=${stockQuery}&hl=en-IN&gl=IN&ceid=IN:en`
    }
  ];

  const results = await Promise.allSettled(feeds.map((feed) => fetchFeed(feed.url, feed.source)));
  return results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}
