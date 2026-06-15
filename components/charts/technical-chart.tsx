"use client";

import {
  createChart,
  ColorType,
  type IChartApi,
  type Time,
  type UTCTimestamp
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";

type LinePoint = { time: number; value: number };
type CandlePoint = { time: number; open: number; high: number; low: number; close: number };

type CandleResponse = {
  symbol: string;
  candles: CandlePoint[];
  ema20: LinePoint[];
  ema50: LinePoint[];
  ema200: LinePoint[];
};

const asTime = (value: number) => value as UTCTimestamp as Time;

export function TechnicalChart({ symbols }: { symbols: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [symbol, setSymbol] = useState(symbols[0] ?? "");
  const [data, setData] = useState<CandleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/candles?symbol=${encodeURIComponent(symbol)}`, {
          signal: controller.signal
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load candles");
        }
        setData(payload as CandleResponse);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load candles");
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [symbol]);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    const chart: IChartApi = createChart(containerRef.current, {
      height: 320,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94a3b8"
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.12)" },
        horzLines: { color: "rgba(148, 163, 184, 0.12)" }
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: false }
    });

    const candles = chart.addCandlestickSeries({
      upColor: "#14b8a6",
      downColor: "#f43f5e",
      borderVisible: false,
      wickUpColor: "#14b8a6",
      wickDownColor: "#f43f5e"
    });
    candles.setData(data.candles.map((point) => ({ ...point, time: asTime(point.time) })));

    const addEma = (points: LinePoint[], color: string) => {
      const series = chart.addLineSeries({ color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      series.setData(points.map((point) => ({ time: asTime(point.time), value: point.value })));
    };
    addEma(data.ema20, "#38bdf8");
    addEma(data.ema50, "#a855f7");
    addEma(data.ema200, "#f59e0b");

    chart.timeScale().fitContent();

    const resize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
    };
  }, [data]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={symbol}
          onChange={(event) => setSymbol(event.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          {symbols.map((item) => (
            <option key={item} value={item}>
              {item.replace(".NS", "")}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-[#38bdf8]" />EMA20</span>
          <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-[#a855f7]" />EMA50</span>
          <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-[#f59e0b]" />EMA200</span>
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading candles…</p>}
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <div ref={containerRef} className={`h-[320px] w-full ${loading || error ? "hidden" : ""}`} />
    </div>
  );
}
