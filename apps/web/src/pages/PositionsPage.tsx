import { useQuery } from "@tanstack/react-query";
import { getPositions } from "../api/trading";

export default function PositionsPage() {
  const q = useQuery({ queryKey: ["positions"], queryFn: getPositions });

  if (q.isLoading) return <div>Loading positions…</div>;
  const err = (q.error as any)?.response?.data?.detail;
  if (err) return <div style={{ color: "crimson" }}>Error: {err}</div>;

  const positions = q.data ?? [];

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Positions</h1>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["ID", "Symbol", "Qty", "Avg Price"].map((h) => (
              <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #444", padding: "8px 6px" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => (
            <tr key={p.id}>
              <td style={{ padding: "8px 6px", borderBottom: "1px solid #333" }}>{p.id}</td>
              <td style={{ padding: "8px 6px", borderBottom: "1px solid #333" }}>{p.symbol}</td>
              <td style={{ padding: "8px 6px", borderBottom: "1px solid #333" }}>{p.qty}</td>
              <td style={{ padding: "8px 6px", borderBottom: "1px solid #333" }}>{p.avg_price}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {positions.length === 0 && <p>No positions yet.</p>}
    </div>
  );
}
