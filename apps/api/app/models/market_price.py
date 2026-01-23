from datetime import datetime
from decimal import Decimal

from sqlalchemy import String, DateTime, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class MarketPrice(Base):
    __tablename__ = "market_prices"

    symbol: Mapped[str] = mapped_column(String(16), primary_key=True)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
