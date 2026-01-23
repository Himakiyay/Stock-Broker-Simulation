import { useQuery } from "@tanstack/react-query";
import {
  getMeAccount,
  getTradingAccount,
  getPositions,
  getOrders,
  getPortfolio,
} from "../api/trading";
import OrderTicket from "../components/OrderTicket";

export default function DashboardPage() {
  const meQ = useQuery({ queryKey: ["me"], queryFn: getMeAccount });
  const acctQ = useQuery({ queryKey: ["tradingAccount"], queryFn: getTradingAccount });
  const posQ = useQuery({ queryKey: ["positions"], queryFn: getPositions });
  const ordQ = useQuery({ queryKey: ["orders"], queryFn: getOrders });
  const portfolioQ = useQuery({ queryKey: ["portfolio"], queryFn: getPortfolio });

  const loading =
    meQ.isLoading ||
    acctQ.isLoading ||
    posQ.isLoading ||
    ordQ.isLoading ||
    portfolioQ.isLoading;

  const error =
    (meQ.error as any)?.response?.data?.detail ||
    (acctQ.error as any)?.response?.data?.detail ||
    (posQ.error as any)?.response?.data?.detail ||
    (ordQ.error as any)?.response?.data?.detail ||
    (portfolioQ.error as any)?.response?.data?.detail;

  if (loading) return <div>Loading dashboard…</div>;
  if (error) return <div style={{ color: "crimson" }}>Error: {error}</div>;

  const pf = portfolioQ.data;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>

      <div style={{ display: "grid", gap: 8 }}>
        <div>
          <b>User:</b> {meQ.data?.email ?? meQ.data?.username ?? "—"}
        </div>

        {/* Prefer portfolio numbers (they’re richer), fallback to account if needed */}
        <div>
          <b>Cash:</b> ${pf?.cash?.toFixed?.(2) ?? acctQ.data?.cash_balance?.toFixed?.(2) ?? "—"}
        </div>
        <div>
          <b>Positions Value:</b> ${pf?.positions_value?.toFixed?.(2) ?? "—"}
        </div>
        <div>
          <b>Equity:</b> ${pf?.equity?.toFixed?.(2) ?? "—"}
        </div>
        <div>
          <b>Unrealized P&amp;L:</b> ${pf?.unrealized_pnl?.toFixed?.(2) ?? "—"}
        </div>

        <div>
          <b>Positions:</b> {posQ.data?.length ?? 0}
        </div>
        <div>
          <b>Orders:</b> {ordQ.data?.length ?? 0}
        </div>
      </div>

      <OrderTicket />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <h3>Recent Orders</h3>
          <ul>
            {(ordQ.data ?? []).slice(0, 5).map((o) => (
              <li key={o.id}>
                {o.symbol} {o.side} x{o.qty}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3>Positions</h3>
          <ul>
            {(posQ.data ?? []).slice(0, 5).map((p) => (
              <li key={p.id}>
                {p.symbol}: {p.qty} @ {p.avg_price}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
