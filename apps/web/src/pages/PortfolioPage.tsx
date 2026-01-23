import { useQuery } from "@tanstack/react-query";
import { getPortfolio } from "../api/trading";

type PortfolioPosition = {
  symbol: string;
  qty: number | string;
  avg_price: number | string;
  last_price: number | string;
  market_value: number | string;
  unrealized_pnl: number | string;
  unrealized_pnl_pct: number | string;
};

type PortfolioResponse = { positions: PortfolioPosition[] } | PortfolioPosition[];

const n = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0));

export default function PortfolioPage() {
  const q = useQuery({
    queryKey: ["portfolio"],
    queryFn: getPortfolio,
  });

  if (q.isLoading) return <div>Loading portfolio…</div>;

  const err = (q.error as any)?.response?.data?.detail ?? (q.error as any)?.message;
  if (err) return <div style={{ color: "#ff5c7a" }}>Error: {err}</div>;

  const raw = q.data as PortfolioResponse | undefined;
  const positions: PortfolioPosition[] = Array.isArray(raw) ? raw : raw?.positions ?? [];

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Portfolio</h1>

      <div style={{ border: "1px solid #242833", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#151925" }}>
            <tr>
              {["Symbol", "Qty", "Avg", "Last", "Value", "Unrealized", "P&L %"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "12px 10px", borderBottom: "1px solid #242833" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {positions.map((p) => {
              const upnl = n(p.unrealized_pnl);
              return (
                <tr key={p.symbol}>
                  <td style={{ padding: "10px", borderBottom: "1px solid #242833" }}>{p.symbol}</td>
                  <td style={{ padding: "10px", borderBottom: "1px solid #242833" }}>{n(p.qty)}</td>
                  <td style={{ padding: "10px", borderBottom: "1px solid #242833" }}>${n(p.avg_price).toFixed(2)}</td>
                  <td style={{ padding: "10px", borderBottom: "1px solid #242833" }}>${n(p.last_price).toFixed(2)}</td>
                  <td style={{ padding: "10px", borderBottom: "1px solid #242833" }}>${n(p.market_value).toFixed(2)}</td>
                  <td style={{ padding: "10px", borderBottom: "1px solid #242833", color: upnl >= 0 ? "#3ddc84" : "#ff5c7a" }}>
                    ${upnl.toFixed(2)}
                  </td>
                  <td style={{ padding: "10px", borderBottom: "1px solid #242833" }}>
                    {(n(p.unrealized_pnl_pct) * 100).toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {positions.length === 0 && <p style={{ opacity: 0.8 }}>No positions yet.</p>}
    </div>
  );
}
