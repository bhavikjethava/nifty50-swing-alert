import { Bell, ShieldAlert, TrendingDown, TrendingUp } from "lucide-react";
import { TechnicalChart } from "@/components/charts/technical-chart";
import { AutoRefresh } from "@/components/auto-refresh";
import { WatchlistTable } from "@/components/watchlist-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/lib/server/dashboard";
import { formatDateTime, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const positive = data.sentiments.find((item) => item.sentiment === "POSITIVE")?._count ?? 0;
  const negative = data.sentiments.find((item) => item.sentiment === "NEGATIVE")?._count ?? 0;
  const neutral = data.sentiments.find((item) => item.sentiment === "NEUTRAL")?._count ?? 0;
  const symbols = data.watchlist.map((row) => row.symbol);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Nifty50 Swing Alert</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Monitors Nifty 50 stocks with free RSS news, Yahoo Finance OHLCV data, and Telegram notifications. Signals are informational only.
          </p>
        </div>
        <AutoRefresh />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Stocks Monitored</CardTitle>
            <ShieldAlert size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{data.totalStocks}</div>
            <p className="text-xs text-muted-foreground">Static Nifty 50 universe</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Active Alerts</CardTitle>
            <Bell size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{data.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">Generated in the last 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Positive News</CardTitle>
            <TrendingUp size={18} className="text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{positive}</div>
            <p className="text-xs text-muted-foreground">Keyword sentiment, last 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Negative News</CardTitle>
            <TrendingDown size={18} className="text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{negative}</div>
            <p className="text-xs text-muted-foreground">Neutral: {neutral}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Technical Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <TechnicalChart symbols={symbols} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Latest News Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.latestNews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No news records stored yet. Run the news scanner to populate this feed.</p>
            ) : (
              data.latestNews.map((item) => (
                <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="block rounded-md border p-3 hover:bg-muted/45">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{item.stock.symbol.replace(".NS", "")}</span>
                    <Badge tone={item.sentiment === "POSITIVE" ? "positive" : item.sentiment === "NEGATIVE" ? "negative" : "neutral"}>
                      {item.sentiment}
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.title}</p>
                </a>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.latestAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No alerts generated yet.</p>
            ) : (
              data.latestAlerts.map((alert) => (
                <div key={alert.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{alert.stock.symbol.replace(".NS", "")}</span>
                    <Badge tone={alert.signal === "BULLISH" ? "bullish" : "bearish"}>{alert.signal}</Badge>
                  </div>
                  <div className="mt-2 text-sm">{formatMoney(alert.price)}</div>
                  <div className="text-xs text-muted-foreground">{formatDateTime(alert.createdAt)}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Watchlist</h2>
            <p className="text-sm text-muted-foreground">Search, sort, and filter the monitored universe.</p>
          </div>
          <WatchlistTable rows={data.watchlist} />
        </div>
      </section>
    </div>
  );
}
