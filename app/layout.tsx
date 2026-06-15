import type React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Activity, BellRing, LineChart, Target } from "lucide-react";
import "./globals.css";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Nifty50 Swing Alert",
  description: "News-backed technical swing alerts for Nifty 50 stocks."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <div className="min-h-screen">
          <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
              <Link href="/" className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <LineChart size={19} />
                </span>
                <span>
                  <span className="block text-sm font-semibold">Nifty50 Swing Alert</span>
                  <span className="block text-xs text-muted-foreground">Informational alerts only</span>
                </span>
              </Link>
              <nav className="flex items-center gap-2">
                <Link className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary sm:flex" href="/">
                  <Activity size={16} /> Dashboard
                </Link>
                <Link className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary sm:flex" href="/signals">
                  <Target size={16} /> Signals
                </Link>
                <Link className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary sm:flex" href="/watchlist">
                  <BellRing size={16} /> Watchlist
                </Link>
                <ThemeToggle />
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
