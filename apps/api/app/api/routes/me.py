from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.account import Account

router = APIRouter(prefix="/me", tags=["me"])

@router.get("/account")
def my_account(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    acct = db.scalar(select(Account).where(Account.user_id == int(user_id)))
    return {
        "user_id": int(user_id),
        "cash_balance": float(acct.cash_balance) if acct else None,
    }
