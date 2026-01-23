from typing import Optional, Literal
from pydantic import BaseModel, Field


class OrderCreate(BaseModel):
    symbol: str = Field(min_length=1, max_length=16)
    side: Literal["buy", "sell"]
    qty: int = Field(ge=1)


class OrderOut(BaseModel):
    id: int
    symbol: str
    side: str
    qty: int
    status: str
    filled_price: Optional[float]

    class Config:
        from_attributes = True


class PositionOut(BaseModel):
    symbol: str
    qty: int
    avg_price: float

    class Config:
        from_attributes = True