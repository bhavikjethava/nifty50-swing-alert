"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AutoRefresh() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const refresh = () => {
    startTransition(() => {
      router.refresh();
      setLastRefresh(new Date());
    });
  };

  useEffect(() => {
    const timer = window.setInterval(refresh, 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  });

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>Updated {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
      <Button variant="outline" onClick={refresh} disabled={isPending} title="Refresh now">
        <RefreshCw size={16} className={isPending ? "animate-spin" : ""} />
      </Button>
    </div>
  );
}
