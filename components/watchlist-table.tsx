"use client";

import { ArrowDownUp, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, formatMoney } from "@/lib/utils";

type Row = {
  id: number;
  symbol: string;
  name: string;
  sector: string;
  latestNews: { sentiment: string; title: string; publishedAt: Date | string } | null;
  latestSnapshot: { trend: string; price: number; scannedAt: Date | string } | null;
  latestAlert: { signal: string; createdAt: Date | string } | null;
};

const filters = ["ALL", "BULLISH", "BEARISH", "POSITIVE", "NEGATIVE"] as const;

function sentimentTone(sentiment?: string | null) {
  if (sentiment === "POSITIVE") return "positive";
  if (sentiment === "NEGATIVE") return "negative";
  return "neutral";
}

function trendTone(trend?: string | null) {
  if (trend === "BULLISH") return "bullish";
  if (trend === "BEARISH") return "bearish";
  return "neutral";
}

export function WatchlistTable({ rows }: { rows: Row[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("ALL");
  const [sortAsc, setSortAsc] = useState(true);

  const filteredRows = useMemo(() => {
    return rows
      .filter((row) => {
        const text = `${row.symbol} ${row.name} ${row.sector}`.toLowerCase();
        const matchesQuery = text.includes(query.toLowerCase());
        const matchesFilter =
          filter === "ALL" ||
          row.latestSnapshot?.trend === filter ||
          row.latestNews?.sentiment === filter;
        return matchesQuery && matchesFilter;
      })
      .sort((a, b) => (sortAsc ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol)));
  }, [rows, query, filter, sortAsc]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground" size={16} />
          <Input className="pl-9" placeholder="Search symbol, company, sector" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <Button key={item} variant={filter === item ? "default" : "outline"} onClick={() => setFilter(item)}>
              {item}
            </Button>
          ))}
          <Button variant="outline" onClick={() => setSortAsc((value) => !value)} title="Sort symbols">
            <ArrowDownUp size={16} />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Trend</TableHead>
                <TableHead>Latest Signal</TableHead>
                <TableHead>News Sentiment</TableHead>
                <TableHead>Last Alert</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-semibold">{row.symbol.replace(".NS", "")}</div>
                    <div className="text-xs text-muted-foreground">{row.name}</div>
                  </TableCell>
                  <TableCell>{formatMoney(row.latestSnapshot?.price)}</TableCell>
                  <TableCell>
                    <Badge tone={trendTone(row.latestSnapshot?.trend)}>{row.latestSnapshot?.trend ?? "PENDING"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge tone={trendTone(row.latestAlert?.signal)}>{row.latestAlert?.signal ?? "NONE"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge tone={sentimentTone(row.latestNews?.sentiment)}>{row.latestNews?.sentiment ?? "PENDING"}</Badge>
                    <div className="mt-1 max-w-[360px] truncate text-xs text-muted-foreground">{row.latestNews?.title ?? "No stored news yet"}</div>
                  </TableCell>
                  <TableCell>{formatDateTime(row.latestAlert?.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
