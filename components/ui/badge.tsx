import type React from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-secondary text-secondary-foreground",
  bullish: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  bearish: "bg-red-500/15 text-red-600 dark:text-red-300",
  positive: "bg-teal-500/15 text-teal-600 dark:text-teal-300",
  negative: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300"
};

export function Badge({
  className,
  tone = "neutral",
  children
}: {
  className?: string;
  tone?: keyof typeof tones;
  children: React.ReactNode;
}) {
  return (
    <span className={cn("inline-flex items-center rounded px-2 py-1 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}
