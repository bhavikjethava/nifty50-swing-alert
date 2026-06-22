import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getBacktestData } from "@/lib/server/backtest-data";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

function winRateTone(winRate: number) {
  if (winRate >= 55) return "bullish";
  if (winRate >= 45) return "warning";
  return "bearish";
}

export default async function BacktestPage() {
  const { rows, summary, ranAt } = await getBacktestData();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-semibold tracking-normal">Backtest</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          How the BUY/SELL rules would have performed over each stock&apos;s ~250-day history. This is how you judge
          whether a signal is trustworthy — a win rate above ~55% with positive returns suggests edge. Past results do
          not guarantee future performance.
        </p>
        {ranAt ? <p className="mt-1 text-xs text-muted-foreground">Last run: {formatDateTime(ranAt)}</p> : null}
      </section>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No backtest results yet. Run <code className="rounded bg-secondary px-1.5 py-0.5">npm run backtest</code> to
            replay the rules over history.
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Overall Win Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{summary.overallWinRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">{summary.totalTrades} simulated trades</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Avg Return / Trade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{summary.avgReturnPerTrade.toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground">In the signal&apos;s direction</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Vs Buy &amp; Hold</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{summary.avgVsBuyHold >= 0 ? "+" : ""}{summary.avgVsBuyHold.toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground">Avg edge per symbol</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Symbols Tested</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{summary.symbols}</div>
                <p className="text-xs text-muted-foreground">With at least one trade</p>
              </CardContent>
            </Card>
          </section>

          <div className="overflow-hidden rounded-lg border bg-card">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Win Rate</TableHead>
                    <TableHead>Trades</TableHead>
                    <TableHead>Avg Return</TableHead>
                    <TableHead>Total Return</TableHead>
                    <TableHead>Buy &amp; Hold</TableHead>
                    <TableHead>Avg Hold</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-semibold">{row.symbol.replace(".NS", "")}</TableCell>
                      <TableCell>
                        <Badge tone={winRateTone(row.winRate)}>{row.winRate.toFixed(0)}%</Badge>
                      </TableCell>
                      <TableCell>{row.trades}</TableCell>
                      <TableCell className={row.avgReturnPct >= 0 ? "text-emerald-500" : "text-rose-500"}>
                        {row.avgReturnPct.toFixed(2)}%
                      </TableCell>
                      <TableCell className={row.totalReturnPct >= 0 ? "text-emerald-500" : "text-rose-500"}>
                        {row.totalReturnPct.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-muted-foreground">{row.buyHoldReturnPct.toFixed(2)}%</TableCell>
                      <TableCell className="text-muted-foreground">{row.avgHeldDays.toFixed(0)}d</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
