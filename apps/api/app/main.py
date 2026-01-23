from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.me import router as me_router
from app.api.routes.trading import router as trading_router
from app.api.routes.market import router as market_router

app = FastAPI(title="Stock Broker App (Paper Trading)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(me_router)
app.include_router(trading_router)
app.include_router(market_router)

@app.get("/health")
def health():
    return {"status": "ok"}
