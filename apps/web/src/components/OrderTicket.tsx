import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OrderCreate } from "../api/trading";
import {
  placeOrder,
  getTradingAccount,
  getPositions,
  getMarketQuote,
  getMarketHistory,
} from "../api/trading";

const VALID_SYMBOLS = ["AAPL", "MSFT", "TSLA", "AMZN", "GOOGL", "NVDA"] as const;

function floorInt(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function sparklinePoints(values: number[], w = 120, h = 28) {
  if (!values || values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * (w - 2) + 1;
      const y = h - ((v - min) / span) * (h - 2) - 1;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export default function OrderTicket() {
  const [symbol, setSymbol] = useState("AAPL");
  const [side, setSide] = useState<OrderCreate["side"]>("buy");
  const [quantity, setQuantity] = useState<number>(1);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const qc = useQueryClient();

  const cleanedSymbol = useMemo(() => symbol.trim().toUpperCase(), [symbol]);
  const symbolValid = useMemo(
    () => VALID_SYMBOLS.includes(cleanedSymbol as any),
    [cleanedSymbol]
  );

  // --- LIVE DATA ---
  const accountQ = useQuery({
    queryKey: ["tradingAccount"],
    queryFn: getTradingAccount,
    refetchInterval: 2000,
  });

  const positionsQ = useQuery({
    queryKey: ["positions"],
    queryFn: getPositions,
    refetchInterval: 2000,
  });

  const quoteQ = useQuery({
    queryKey: ["quote", cleanedSymbol],
    enabled: symbolValid,
    queryFn: () => getMarketQuote(cleanedSymbol),
    refetchInterval: 2000,
  });

  // --- HISTORY (for sparkline / indicator) ---
  const historyQ = useQuery({
    queryKey: ["history", cleanedSymbol],
    enabled: symbolValid,
    queryFn: () => getMarketHistory(cleanedSymbol, 60),
    refetchInterval: 2000,
  });

  const cash = accountQ.data?.cash_balance ?? 0;
  const lastPrice = quoteQ.data?.price ?? null;

  const prices = historyQ.data ?? [];

  // Compare last two points for ▲▼
  const trend = useMemo(() => {
    if (!prices || prices.length < 2) return { dir: "none" as const, pct: 0 };
    const a = prices[prices.length - 2];
    const b = prices[prices.length - 1];
    const delta = b - a;
    const pct = a !== 0 ? (delta / a) * 100 : 0;

    const dir =
      delta > 0 ? ("up" as const) : delta < 0 ? ("down" as const) : ("flat" as const);
    return { dir, pct };
  }, [prices]);

  const trendColor =
    trend.dir === "up" ? "#3ddc84" : trend.dir === "down" ? "#ff5c7a" : "#c9d1d9";

  const sparkPts = useMemo(() => sparklinePoints(prices), [prices]);

  const heldShares = useMemo(() => {
    const rows = positionsQ.data ?? [];
    const row = rows.find((p) => p.symbol?.toUpperCase() === cleanedSymbol);
    return row ? Number(row.qty) : 0;
  }, [positionsQ.data, cleanedSymbol]);

  const maxBuy = useMemo(() => {
    if (!lastPrice || lastPrice <= 0) return 0;
    return floorInt(cash / lastPrice);
  }, [cash, lastPrice]);

  const maxSell = useMemo(() => floorInt(heldShares), [heldShares]);

  // --- VALIDATION ---
  const qtyValid = Number.isFinite(quantity) && quantity >= 1 && Number.isInteger(quantity);

  const clientValidationMessage = useMemo(() => {
    if (!cleanedSymbol) return "Symbol is required.";
    if (!symbolValid) return `Unsupported symbol. Allowed: ${VALID_SYMBOLS.join(", ")}`;
    if (!qtyValid) return "Quantity must be a whole number >= 1.";

    if (side === "buy") {
      if (!lastPrice) return "Waiting for live price…";
      if (quantity > maxBuy) return `Insufficient cash. Max buy: ${maxBuy}`;
    } else {
      if (quantity > maxSell) return `Insufficient shares. Max sell: ${maxSell}`;
    }

    return null;
  }, [cleanedSymbol, symbolValid, qtyValid, side, lastPrice, quantity, maxBuy, maxSell]);

  // --- EST COST / PROCEEDS ---
  const estNotional = useMemo(() => {
    if (!lastPrice) return null;
    return lastPrice * quantity;
  }, [lastPrice, quantity]);

  // --- PLACE ORDER ---
  const m = useMutation({
    mutationFn: placeOrder,
    onSuccess: async () => {
      setErr(null);
      setOk(`✅ ${side.toUpperCase()} ${quantity} ${cleanedSymbol} submitted`);
      setQuantity(1);

      await Promise.all([
        qc.invalidateQueries({ queryKey: ["orders"] }),
        qc.invalidateQueries({ queryKey: ["positions"] }),
        qc.invalidateQueries({ queryKey: ["tradingAccount"] }),
        qc.invalidateQueries({ queryKey: ["portfolio"] }),
        qc.invalidateQueries({ queryKey: ["quote", cleanedSymbol] }),
        qc.invalidateQueries({ queryKey: ["history", cleanedSymbol] }),
      ]);

      setTimeout(() => setOk(null), 2500);
    },
    onError: (e: any) => {
      setOk(null);
      setErr(e?.response?.data?.detail ?? "Order failed");
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);

    if (clientValidationMessage) {
      setErr(clientValidationMessage);
      return;
    }

    m.mutate({
      symbol: cleanedSymbol,
      side,
      qty: Number(quantity),
    });
  }

  const disableSubmit = !!clientValidationMessage || m.isPending;

  return (
    <div
      style={{
        border: "1px solid #242833",
        padding: 16,
        borderRadius: 12,
        maxWidth: 460,
        background: "#151925",
      }}
    >
      <h3 style={{ marginTop: 0 }}>Order Ticket</h3>

      <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 10 }}>
        Allowed symbols: <b>{VALID_SYMBOLS.join(", ")}</b>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            border: "1px solid #2a2f3b",
            borderRadius: 10,
            padding: 10,
            background: "#0f1115",
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.8 }}>Last Price</div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {quoteQ.isLoading ? "…" : lastPrice ? `$${lastPrice.toFixed(4)}` : "—"}
            </div>

            {trend.dir !== "none" && (
              <div style={{ fontSize: 12, color: trendColor, fontWeight: 600 }}>
                {trend.dir === "up" ? "▲" : trend.dir === "down" ? "▼" : "•"}{" "}
                {trend.pct >= 0 ? "+" : ""}
                {trend.pct.toFixed(2)}%
              </div>
            )}
          </div>

          {sparkPts ? (
            <svg
              width={120}
              height={28}
              style={{ marginTop: 6, opacity: 0.95, color: trendColor }}
              viewBox="0 0 120 28"
            >
              <polyline fill="none" stroke="currentColor" strokeWidth="2" points={sparkPts} />
            </svg>
          ) : (
            <div style={{ height: 28, marginTop: 6, opacity: 0.5, fontSize: 12 }}>—</div>
          )}
        </div>

        <div
          style={{
            border: "1px solid #2a2f3b",
            borderRadius: 10,
            padding: 10,
            background: "#0f1115",
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.8 }}>Cash</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {accountQ.isLoading ? "…" : `$${Number(cash).toFixed(2)}`}
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Symbol
          <select
            value={cleanedSymbol}
            onChange={(e) => setSymbol(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 10,
              border: "1px solid #2a2f3b",
              background: "#0f1115",
              color: "white",
            }}
          >
            {VALID_SYMBOLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Side
          <select
            value={side}
            onChange={(e) => setSide(e.target.value as OrderCreate["side"])}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 10,
              border: "1px solid #2a2f3b",
              background: "#0f1115",
              color: "white",
            }}
          >
            <option value="buy">buy</option>
            <option value="sell">sell</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Quantity
          <input
            value={Number.isFinite(quantity) ? quantity : ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") {
                setQuantity(NaN);
                return;
              }
              setQuantity(Number(v));
            }}
            type="number"
            min={1}
            step={1}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 10,
              border: "1px solid #2a2f3b",
              background: "#0f1115",
              color: "white",
            }}
          />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button
            type="button"
            onClick={() => {
              setSide("buy");
              setQuantity(Math.max(1, maxBuy));
            }}
            disabled={!lastPrice || maxBuy < 1}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #2a2f3b",
              background: !lastPrice || maxBuy < 1 ? "#1b1f2a" : "#1f2b45",
              color: "white",
              cursor: !lastPrice || maxBuy < 1 ? "not-allowed" : "pointer",
            }}
          >
            Max Buy ({maxBuy})
          </button>

          <button
            type="button"
            onClick={() => {
              setSide("sell");
              setQuantity(Math.max(1, maxSell));
            }}
            disabled={maxSell < 1}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #2a2f3b",
              background: maxSell < 1 ? "#1b1f2a" : "#1f2b45",
              color: "white",
              cursor: maxSell < 1 ? "not-allowed" : "pointer",
            }}
          >
            Max Sell ({maxSell})
          </button>
        </div>

        <div style={{ fontSize: 12, opacity: 0.85 }}>
          {estNotional == null ? (
            <span>Est. cost/proceeds: —</span>
          ) : side === "buy" ? (
            <span>Est. cost: ${estNotional.toFixed(2)}</span>
          ) : (
            <span>Est. proceeds: ${estNotional.toFixed(2)}</span>
          )}
        </div>

        {ok && <div style={{ color: "#3ddc84" }}>{ok}</div>}
        {(err || clientValidationMessage) && (
          <div style={{ color: "#ff5c7a" }}>{err ?? clientValidationMessage}</div>
        )}

        <button
          type="submit"
          disabled={disableSubmit}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #2a2f3b",
            background: disableSubmit ? "#1b1f2a" : "#2d6cdf",
            color: "white",
            cursor: disableSubmit ? "not-allowed" : "pointer",
          }}
        >
          {m.isPending ? "Placing…" : "Place Order"}
        </button>
      </form>
    </div>
  );
}
