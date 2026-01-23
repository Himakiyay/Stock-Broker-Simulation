from datetime import datetime
from decimal import Decimal

from sqlalchemy import String, DateTime, func, ForeignKey, Numeric, UniqueConstraint, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Position(Base):
    __tablename__ = "positions"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    symbol: Mapped[str] = mapped_column(String(16), index=True, nullable=False)

    qty: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    avg_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 4),
        nullable=False,
        default=Decimal("0.0000"),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("user_id", "symbol", name="uq_positions_user_symbol"),
    )
