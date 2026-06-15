import { AutoRefresh } from "@/components/auto-refresh";
import { WatchlistTable } from "@/components/watchlist-table";
import { getDashboardData } from "@/lib/server/dashboard";

export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Watchlist</h1>
          <p className="mt-2 text-sm text-muted-foreground">All Nifty 50 stocks with current technical and news state.</p>
        </div>
        <AutoRefresh />
      </section>
      <WatchlistTable rows={data.watchlist} />
    </div>
  );
}
