from pydantic import BaseModel
from typing import List, Optional


class PositionWithQuote(BaseModel):
    symbol: str
    qty: int
    avg_price: float

    last_price: float
    market_value: float
    cost_basis: float
    unrealized_pnl: float
    unrealized_pnl_pct: Optional[float] = None


class PortfolioSummary(BaseModel):
    cash: float
    equity: float
    positions_value: float
    unrealized_pnl: float
    positions: List[PositionWithQuote]
