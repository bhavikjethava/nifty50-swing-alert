import { AutoRefresh } from "@/components/auto-refresh";
import { SignalsTable } from "@/components/signals-table";
import { getSignals } from "@/lib/server/signals";

export const dynamic = "force-dynamic";

export default async function SignalsPage() {
  const signals = await getSignals();

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Signals</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            BUY / SELL / HOLD per stock, combining the technical setup with matching news sentiment. Informational
            only — review the chart before any trade.
          </p>
        </div>
        <AutoRefresh />
      </section>
      <SignalsTable signals={signals} />
    </div>
  );
}
