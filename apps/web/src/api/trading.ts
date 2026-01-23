import { api } from "./client";

export type MeAccount = {
  id?: number;
  email?: string;
  username?: string;
};

export type TradingAccount = {
  cash_balance: number;
};

export type Position = {
  symbol: string;
  qty: number;
  avg_price: number;
};

export type Order = {
  id: number;
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  status: string;
  filled_price?: number | null; // ✅ matches backend
  created_at?: string;
};

export async function getMeAccount() {
  const { data } = await api.get<MeAccount>("/me/account");
  return data;
}

export async function getTradingAccount() {
  const { data } = await api.get<TradingAccount>("/trading/account");
  return data;
}

export async function getPositions() {
  const { data } = await api.get<Position[]>("/trading/positions");
  return data;
}

export async function getOrders() {
  const { data } = await api.get<Order[]>("/trading/orders");
  return data;
}

export type OrderCreate = {
  symbol: string;
  side: "buy" | "sell";
  qty: number;
};

export async function placeOrder(payload: OrderCreate) {
  const { data } = await api.post("/trading/orders", payload);
  return data;
}

export type PositionWithQuote = {
  symbol: string;
  qty: number | string;
  avg_price: number | string;
  last_price: number | string;
  market_value: number | string;
  cost_basis: number | string;
  unrealized_pnl: number | string;
  unrealized_pnl_pct?: number | string | null;
};

export type PortfolioSummary = {
  cash: number | string;
  equity: number | string;
  positions_value: number | string;
  unrealized_pnl: number | string;
  positions: PositionWithQuote[];
};

export async function getPortfolio() {
  const { data } = await api.get<PortfolioSummary>("/trading/portfolio");
  return data;
}

// -------------------------
// ✅ Live market price (for OrderTicket)
// Requires backend: GET /market/price/{symbol}
// -------------------------
export type MarketPriceResponse = {
  symbol: string;
  price: number;
};

export async function getMarketPrice(symbol: string) {
  const { data } = await api.get<MarketPriceResponse>(
    `/market/price/${encodeURIComponent(symbol)}`
  );
  return data;
}

// ---- Market API ----
export type MarketQuote = {
  symbol: string;
  price: number;
  updated_at: string;
};

export async function getMarketSymbols() {
  const { data } = await api.get<string[]>("/market/symbols");
  return data;
}

export async function getMarketQuote(symbol: string) {
  const { data } = await api.get<MarketQuote>(`/market/quote/${encodeURIComponent(symbol)}`);
  return data;
}


export async function getMarketHistory(symbol: string, limit = 60): Promise<number[]> {
  const { data } = await api.get<number[]>(`/market/history/${symbol}`, {
    params: { limit },
  });
  return data;
}
