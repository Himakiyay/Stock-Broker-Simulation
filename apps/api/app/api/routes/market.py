from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.core.database import get_db
from app.models.market_price import MarketPrice
from app.models.market_tick import MarketTick

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/symbols")
def symbols(db: Session = Depends(get_db)):
    rows = db.execute(select(MarketPrice.symbol).order_by(MarketPrice.symbol)).all()
    return [r[0] for r in rows]


@router.get("/quote/{symbol}")
def quote(symbol: str, db: Session = Depends(get_db)):
    symbol = symbol.upper()
    mp = db.get(MarketPrice, symbol)
    if not mp:
        raise HTTPException(status_code=404, detail="Unknown symbol")

    return {
        "symbol": mp.symbol,
        "price": float(mp.price),
        "updated_at": mp.updated_at,
    }


@router.get("/history/{symbol}")
def history(symbol: str, limit: int = 60, db: Session = Depends(get_db)):
    symbol = symbol.upper()

    rows = (
        db.execute(
            select(MarketTick.price)
            .where(MarketTick.symbol == symbol)
            .order_by(desc(MarketTick.ts))
            .limit(limit)
        )
        .scalars()
        .all()
    )

    # oldest -> newest for chart/sparkline
    return [float(p) for p in reversed(rows)]
