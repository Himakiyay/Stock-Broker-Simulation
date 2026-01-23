from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import String, DateTime, func, ForeignKey, Numeric, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    symbol: Mapped[str] = mapped_column(String(16), index=True, nullable=False)
    side: Mapped[str] = mapped_column(String(4), nullable=False)  # "buy" | "sell"
    qty: Mapped[int] = mapped_column(Integer, nullable=False)

    status: Mapped[str] = mapped_column(String(16), nullable=False, default="filled")  # "filled" | "rejected"
    filled_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 4), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
