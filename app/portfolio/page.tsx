import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPortfolio } from "@/lib/paper/portfolio";
import { formatDateTime, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

function pnlClass(value: number) {
  return value > 0 ? "text-emerald-500" : value < 0 ? "text-rose-500" : "text-muted-foreground";
}

function signed(value: number) {
  return `${value >= 0 ? "+" : ""}${formatMoney(value)}`;
}

export default async function PortfolioPage() {
  const { holdings, closedPositions, summary } = await getPortfolio();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-semibold tracking-normal">Paper Portfolio</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Simulated trading of the mean-reversion strategy with ₹{summary.startingCapital.toLocaleString("en-IN")}{" "}
          starting capital. Each BUY uses 10% of available cash; positions exit when price reclaims EMA20 or the hold
          horizon passes. No real money — for strategy verification only.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Total Equity</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{formatMoney(summary.equity)}</div>
            <p className="text-xs text-muted-foreground">Cash {formatMoney(summary.cash)} + holdings {formatMoney(summary.holdingsValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total P&amp;L</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-3xl font-semibold ${pnlClass(summary.totalPnl)}`}>{signed(summary.totalPnl)}</div>
            <p className={`text-xs ${pnlClass(summary.totalPnl)}`}>{summary.totalPnlPct.toFixed(2)}% vs start</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Realized P&amp;L</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-3xl font-semibold ${pnlClass(summary.realizedPnl)}`}>{signed(summary.realizedPnl)}</div>
            <p className="text-xs text-muted-foreground">Unrealized {signed(summary.unrealizedPnl)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Closed Trades</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{summary.closedTrades}</div>
            <p className="text-xs text-muted-foreground">Win rate {summary.winRate.toFixed(0)}%</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Open Holdings ({holdings.length})</h2>
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Entry</TableHead>
                  <TableHead>Last</TableHead>
                  <TableHead>Market Value</TableHead>
                  <TableHead>Unrealized P&amp;L</TableHead>
                  <TableHead>Since</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                      No open positions. The strategy buys when a stock signals oversold (BUY).
                    </TableCell>
                  </TableRow>
                ) : (
                  holdings.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="font-semibold">{h.symbol.replace(".NS", "")}</TableCell>
                      <TableCell>{h.quantity}</TableCell>
                      <TableCell>{formatMoney(h.entryPrice)}</TableCell>
                      <TableCell>{formatMoney(h.lastPrice)}</TableCell>
                      <TableCell>{formatMoney(h.marketValue)}</TableCell>
                      <TableCell className={pnlClass(h.unrealizedPnl)}>
                        {signed(h.unrealizedPnl)} <span className="text-xs">({h.unrealizedPnlPct.toFixed(1)}%)</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDateTime(h.entryDate)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Trade History ({closedPositions.length})</h2>
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Entry</TableHead>
                  <TableHead>Exit</TableHead>
                  <TableHead>Realized P&amp;L</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Closed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {closedPositions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                      No closed trades yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  closedPositions.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-semibold">{p.symbol.replace(".NS", "")}</TableCell>
                      <TableCell>{p.quantity}</TableCell>
                      <TableCell>{formatMoney(p.entryPrice)}</TableCell>
                      <TableCell>{formatMoney(p.exitPrice ?? undefined)}</TableCell>
                      <TableCell className={pnlClass(p.realizedPnl ?? 0)}>{signed(p.realizedPnl ?? 0)}</TableCell>
                      <TableCell><Badge tone="neutral">{p.exitReason ?? "-"}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDateTime(p.exitDate)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </div>
  );
}
