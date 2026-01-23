from decimal import Decimal, ROUND_HALF_UP
import logging
from typing import Final

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.account import Account
from app.models.order import Order
from app.models.position import Position
from app.schemas.trading import OrderCreate, OrderOut, PositionOut
from app.schemas.portfolio import PortfolioSummary, PositionWithQuote
from app.services.quotes import get_quote


router = APIRouter(prefix="/trading", tags=["trading"])
logger = logging.getLogger(__name__)

# ✅ Must match market/engine.py SYMBOLS
VALID_SYMBOLS: Final[set[str]] = {
    "AAPL",
    "MSFT",
    "TSLA",
    "AMZN",
    "GOOGL",
    "NVDA",
}


@router.post("/orders", response_model=OrderOut, status_code=201)
def place_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    uid = int(user_id)
    symbol = payload.symbol.upper().strip()
    side = payload.side
    qty = int(payload.qty)

    # =========================
    # ✅ VALIDATION BLOCK
    # =========================
    if not symbol:
        raise HTTPException(status_code=400, detail="Symbol is required")

    if symbol not in VALID_SYMBOLS:
        allowed = ", ".join(sorted(VALID_SYMBOLS))
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported symbol '{symbol}'. Allowed: {allowed}",
        )

    if side not in ("buy", "sell"):
        raise HTTPException(status_code=400, detail="Invalid side (must be 'buy' or 'sell')")

    if qty <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be >= 1")
    # =========================

    # Decimal money math (price comes from synthetic market via DB)
    try:
        price = get_quote(db, symbol).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
    except ValueError as e:
        # If symbol is valid but market hasn't seeded it yet
        raise HTTPException(status_code=400, detail=str(e))

    notional = (price * Decimal(qty)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    account = db.scalar(select(Account).where(Account.user_id == uid))
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    position = db.scalar(
        select(Position).where(Position.user_id == uid, Position.symbol == symbol)
    )

    # =========================
    # BUY
    # =========================
    if side == "buy":
        # account.cash_balance is Numeric -> Decimal at runtime
        if Decimal(account.cash_balance) < notional:
            order = Order(
                user_id=uid,
                symbol=symbol,
                side=side,
                qty=qty,
                status="rejected",
                filled_price=None,
            )
            db.add(order)
            db.commit()
            raise HTTPException(status_code=400, detail="Insufficient cash")

        account.cash_balance = (Decimal(account.cash_balance) - notional).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        if position is None:
            position = Position(
                user_id=uid,
                symbol=symbol,
                qty=qty,
                avg_price=price,
            )
            db.add(position)
        else:
            old_qty = int(position.qty)
            new_qty = old_qty + qty

            old_cost = Decimal(position.avg_price) * Decimal(old_qty)
            new_cost = old_cost + notional

            position.qty = new_qty
            position.avg_price = (new_cost / Decimal(new_qty)).quantize(
                Decimal("0.0001"), rounding=ROUND_HALF_UP
            )

        order = Order(
            user_id=uid,
            symbol=symbol,
            side=side,
            qty=qty,
            status="filled",
            filled_price=price,
        )
        db.add(order)
        db.commit()
        db.refresh(order)

        return OrderOut(
            id=order.id,
            symbol=order.symbol,
            side=order.side,
            qty=order.qty,
            status=order.status,
            filled_price=float(order.filled_price),
        )

    # =========================
    # SELL
    # =========================
    held = int(position.qty) if position is not None else 0
    if held < qty:
        order = Order(
            user_id=uid,
            symbol=symbol,
            side=side,
            qty=qty,
            status="rejected",
            filled_price=None,
        )
        db.add(order)
        db.commit()
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient shares (have {held}, tried to sell {qty})",
        )

    account.cash_balance = (Decimal(account.cash_balance) + notional).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )

    # position must exist here because held >= qty and qty > 0
    position.qty = held - qty
    if position.qty == 0:
        db.delete(position)

    order = Order(
        user_id=uid,
        symbol=symbol,
        side=side,
        qty=qty,
        status="filled",
        filled_price=price,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    return OrderOut(
        id=order.id,
        symbol=order.symbol,
        side=order.side,
        qty=order.qty,
        status=order.status,
        filled_price=float(order.filled_price),
    )


@router.get("/positions", response_model=list[PositionOut])
def list_positions(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    uid = int(user_id)
    positions = db.scalars(
        select(Position).where(Position.user_id == uid).order_by(Position.symbol)
    ).all()

    return [
        PositionOut(symbol=p.symbol, qty=int(p.qty), avg_price=float(p.avg_price))
        for p in positions
    ]


@router.get("/orders", response_model=list[OrderOut])
def list_orders(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    uid = int(user_id)
    return db.scalars(
        select(Order)
        .where(Order.user_id == uid)
        .order_by(Order.id.desc())
    ).all()


@router.get("/account")
def get_account(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    uid = int(user_id)
    account = db.scalar(select(Account).where(Account.user_id == uid))
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"cash_balance": float(account.cash_balance)}


@router.get("/portfolio", response_model=PortfolioSummary)
def get_portfolio(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    uid = int(user_id)

    account = db.scalar(select(Account).where(Account.user_id == uid))
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    positions = db.scalars(select(Position).where(Position.user_id == uid)).all()

    pos_out: list[PositionWithQuote] = []
    positions_value = 0.0
    unrealized_total = 0.0

    for p in positions:
        try:
            price = float(get_quote(db, p.symbol))
        except ValueError:
            # If a position exists for a symbol that isn't in market_prices yet,
            # treat last price as 0.0 (safer than crashing the endpoint)
            price = 0.0

        qty = int(p.qty)
        avg = float(p.avg_price)

        cost_basis = qty * avg
        market_value = qty * price
        unrealized = (price - avg) * qty

        positions_value += market_value
        unrealized_total += unrealized

        pct = unrealized / cost_basis if cost_basis != 0 else None

        pos_out.append(
            PositionWithQuote(
                symbol=p.symbol,
                qty=qty,
                avg_price=avg,
                last_price=price,
                market_value=market_value,
                cost_basis=cost_basis,
                unrealized_pnl=unrealized,
                unrealized_pnl_pct=pct,
            )
        )

    cash = float(account.cash_balance)
    equity = cash + positions_value

    return PortfolioSummary(
        cash=cash,
        equity=equity,
        positions_value=positions_value,
        unrealized_pnl=unrealized_total,
        positions=pos_out,
    )
