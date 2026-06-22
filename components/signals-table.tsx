"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, formatMoney } from "@/lib/utils";

type Signal = {
  id: number;
  symbol: string;
  name: string;
  sector: string;
  verdict: "BUY" | "SELL" | "HOLD";
  price: number | null;
  trend: string | null;
  sentiment: string | null;
  newsTitle: string | null;
  reasons: string[];
  scannedAt: Date | string | null;
  holdMinDays: number;
  holdMaxDays: number;
  holdConfidence: string;
  exitRule: string;
};

const filters = ["ALL", "BUY", "SELL", "HOLD"] as const;

function verdictTone(verdict: Signal["verdict"]) {
  if (verdict === "BUY") return "bullish";
  if (verdict === "SELL") return "bearish";
  return "warning";
}

function confidenceTone(confidence: string) {
  if (confidence === "HIGH") return "bullish";
  if (confidence === "MEDIUM") return "warning";
  return "neutral";
}

// Trading-day window → human horizon (≥10 days shown in weeks).
function formatHold(minDays: number, maxDays: number) {
  if (maxDays <= 0) return "—";
  const label = (days: number) => (days >= 10 ? `${Math.round(days / 5)}w` : `${days}d`);
  return minDays === maxDays ? label(maxDays) : `${label(minDays)}–${label(maxDays)}`;
}

export function SignalsTable({ signals }: { signals: Signal[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("ALL");

  const rows = useMemo(() => {
    return signals.filter((signal) => {
      const text = `${signal.symbol} ${signal.name} ${signal.sector}`.toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());
      const matchesFilter = filter === "ALL" || signal.verdict === filter;
      return matchesQuery && matchesFilter;
    });
  }, [signals, query, filter]);

  const counts = useMemo(
    () => ({
      BUY: signals.filter((s) => s.verdict === "BUY").length,
      SELL: signals.filter((s) => s.verdict === "SELL").length,
      HOLD: signals.filter((s) => s.verdict === "HOLD").length
    }),
    [signals]
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground" size={16} />
          <Input
            className="pl-9"
            placeholder="Search symbol, company, sector"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <Button key={item} variant={filter === item ? "default" : "outline"} onClick={() => setFilter(item)}>
              {item}
              {item !== "ALL" ? ` (${counts[item]})` : ""}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Signal</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Suggested Hold</TableHead>
                <TableHead>Why</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((signal) => (
                <TableRow key={signal.id}>
                  <TableCell>
                    <Badge tone={verdictTone(signal.verdict)}>{signal.verdict}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{signal.symbol.replace(".NS", "")}</div>
                    <div className="text-xs text-muted-foreground">{signal.name}</div>
                  </TableCell>
                  <TableCell>{formatMoney(signal.price ?? undefined)}</TableCell>
                  <TableCell>
                    {signal.verdict === "HOLD" ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{formatHold(signal.holdMinDays, signal.holdMaxDays)}</div>
                        <Badge tone={confidenceTone(signal.holdConfidence)}>{signal.holdConfidence}</Badge>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <ul className="max-w-[420px] space-y-0.5 text-xs text-muted-foreground">
                      {signal.reasons.map((reason) => (
                        <li key={reason}>• {reason}</li>
                      ))}
                      {signal.verdict !== "HOLD" && signal.exitRule ? (
                        <li className="text-amber-600 dark:text-amber-300">• {signal.exitRule}</li>
                      ) : null}
                    </ul>
                    {signal.newsTitle ? (
                      <div className="mt-1 max-w-[420px] truncate text-xs italic text-muted-foreground">
                        “{signal.newsTitle}”
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>{formatDateTime(signal.scannedAt ?? undefined)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
