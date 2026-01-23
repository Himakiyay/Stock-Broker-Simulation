from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.market_price import MarketPrice

def get_quote(db: Session, symbol: str) -> Decimal:
    symbol = symbol.upper()
    mp = db.get(MarketPrice, symbol)
    if not mp:
        raise ValueError(f"Unknown symbol: {symbol}")
    return Decimal(mp.price)