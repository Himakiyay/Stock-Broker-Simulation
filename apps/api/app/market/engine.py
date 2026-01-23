import os
import time
import random
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.market_price import MarketPrice
from app.models.market_tick import MarketTick

# Keep in sync with frontend VALID_SYMBOLS
SYMBOLS: dict[str, Decimal] = {
    "AAPL": Decimal("185.00"),
    "MSFT": Decimal("410.00"),
    "TSLA": Decimal("240.00"),
    "AMZN": Decimal("170.00"),
    "GOOGL": Decimal("145.00"),
    "NVDA": Decimal("600.00"),
}

VOL: dict[str, Decimal] = {
    "AAPL": Decimal("0.0020"),
    "MSFT": Decimal("0.0018"),
    "TSLA": Decimal("0.0060"),
    "AMZN": Decimal("0.0025"),
    "GOOGL": Decimal("0.0022"),
    "NVDA": Decimal("0.0050"),
}

TICK_SECONDS = float(os.getenv("MARKET_TICK_SECONDS", "2.0"))


def q4(x: Decimal) -> Decimal:
    return x.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)


def ensure_seed(db):
    """
    Ensure each symbol has:
      - one MarketPrice row (latest price)
      - at least one MarketTick row (history)
    """
    for sym, start_price in SYMBOLS.items():
        row = db.get(MarketPrice, sym)
        if row is None:
            p = q4(start_price)
            db.add(MarketPrice(symbol=sym, price=p))
            db.add(MarketTick(symbol=sym, price=p))
    db.commit()


def step(sym: str, price: Decimal) -> Decimal:
    # Multiplicative random walk
    vol = VOL.get(sym, Decimal("0.0020"))
    drift = Decimal("0.00005")
    z = Decimal(str(random.gauss(0, 1)))
    change = drift + (vol * z)
    new_price = price * (Decimal("1.0") + change)
    if new_price <= 0:
        new_price = Decimal("1.00")
    return q4(new_price)


def run():
    print(f"[market] starting: tick={TICK_SECONDS}s symbols={list(SYMBOLS.keys())}")
    while True:
        db = SessionLocal()
        try:
            ensure_seed(db)

            prices = db.execute(select(MarketPrice)).scalars().all()
            for mp in prices:
                mp.price = step(mp.symbol, Decimal(mp.price))
                db.add(MarketTick(symbol=mp.symbol, price=mp.price))

            db.commit()
        except Exception as e:
            db.rollback()
            print("[market] error:", e)
        finally:
            db.close()

        time.sleep(TICK_SECONDS)


if __name__ == "__main__":
    run()
