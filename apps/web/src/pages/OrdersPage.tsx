import { useQuery } from "@tanstack/react-query";
import { getOrders } from "../api/trading";

export default function OrdersPage() {
  const q = useQuery({ queryKey: ["orders"], queryFn: getOrders });

  if (q.isLoading) return <div>Loading orders…</div>;
  const err = (q.error as any)?.response?.data?.detail;
  if (err) return <div style={{ color: "crimson" }}>Error: {err}</div>;

  const orders = q.data ?? [];

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Orders</h1>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["ID", "Symbol", "Side", "Qty", "Price", "Status"].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  padding: "8px 6px",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td style={{ padding: "8px 6px", borderBottom: "1px solid #333" }}>
                {o.id}
              </td>
              <td style={{ padding: "8px 6px", borderBottom: "1px solid #333" }}>
                {o.symbol}
              </td>
              <td style={{ padding: "8px 6px", borderBottom: "1px solid #333" }}>
                {o.side}
              </td>
              <td style={{ padding: "8px 6px", borderBottom: "1px solid #333" }}>
                {o.qty}
              </td>
              <td style={{ padding: "8px 6px", borderBottom: "1px solid #333" }}>
                {o.filled_price == null ? "—" : `$${Number(o.filled_price).toFixed(2)}`}
              </td>
              <td style={{ padding: "8px 6px", borderBottom: "1px solid #333" }}>
                {o.status ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {orders.length === 0 && <p>No orders yet.</p>}
    </div>
  );
}
