import { useEffect, useRef, useState } from "react";
import { ColorType, createChart } from "lightweight-charts";

export default function PriceChart({ theme, symbol = "BTCUSDT", interval = "1m", onPriceUpdate }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const isDark = theme === "dark";
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 270,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: isDark ? "rgba(248, 251, 250, 0.62)" : "rgba(17, 17, 17, 0.58)",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: isDark ? "rgba(248, 251, 250, 0.08)" : "rgba(17, 17, 17, 0.1)" },
        horzLines: { color: isDark ? "rgba(248, 251, 250, 0.08)" : "rgba(17, 17, 17, 0.1)" },
      },
      crosshair: {
        vertLine: { color: "rgba(56, 130, 246, 0.5)" },
        horzLine: { color: "rgba(56, 130, 246, 0.5)" },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
      },
    });
    
    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#32C776",
      downColor: "#EF476F",
      borderUpColor: "#32C776",
      borderDownColor: "#EF476F",
      wickUpColor: "#32C776",
      wickDownColor: "#EF476F",
      priceLineColor: "rgba(248, 251, 250, 0.48)",
    });
    seriesRef.current = candleSeries;

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    resizeObserver.observe(containerRef.current);

    // Fetch initial historical data
    fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=100`)
      .then(res => res.json())
      .then(data => {
        const formattedData = data.map(d => ({
          time: d[0] / 1000,
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4])
        }));
        candleSeries.setData(formattedData);
        if (formattedData.length > 0 && onPriceUpdate) {
            onPriceUpdate(formattedData[formattedData.length - 1].close);
        }
        chart.timeScale().fitContent();
      })
      .catch(console.error);

    // Setup WebSocket for live updates
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const kline = message.k;
      const tick = {
        time: kline.t / 1000,
        open: parseFloat(kline.o),
        high: parseFloat(kline.h),
        low: parseFloat(kline.l),
        close: parseFloat(kline.c),
      };
      seriesRef.current.update(tick);
      if (onPriceUpdate) {
        onPriceUpdate(tick.close);
      }
    };

    return () => {
      resizeObserver.disconnect();
      if (wsRef.current) {
        wsRef.current.close();
      }
      chart.remove();
    };
  }, [theme, symbol, interval]);

  return <div ref={containerRef} className="h-[270px] w-full" />;
}

