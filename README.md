# 📈 Stock Broker App (Paper Trading)

A full-stack **paper trading stock broker application** that simulates real-time market prices, allows users to place trades, and tracks portfolio performance — all without real money.

This project was built to deeply understand how trading platforms work end-to-end: authentication, market data, order execution, and portfolio accounting.

---

## 🚀 Features

- 🔐 **User Authentication**
  - Register & login with JWT-based authentication
  - Secure password hashing using bcrypt

- 📊 **Live Market Simulation**
  - Background market engine simulates real-time price movement
  - Configurable tick interval
  - Price history stored for charting and analysis

- 💸 **Paper Trading**
  - Buy & sell stocks at live simulated prices
  - Cash balance and position tracking
  - Order history with execution details

- 📈 **Portfolio Dashboard**
  - Cash, equity, unrealized P&L
  - Positions overview
  - Live price updates

- ⚡ **Modern Frontend**
  - React + Vite
  - TanStack Query for polling and caching
  - Clean, dark trading-style UI

---

## 🧠 Why I Built This

I wanted to go beyond tutorials and build something that:
- Mimics **real trading systems**
- Forces me to think about **data consistency, concurrency, and state**
- Combines backend logic, databases, and frontend UX in a meaningful way

Trading apps are deceptively complex — this project helped me understand:
- Why “simple” trades are not simple
- How backend systems drive frontend behavior
- How real-time systems fail if one piece is missing

---

## 🧩 Most Challenging Part

The most challenging part was implementing and debugging the **real-time market engine**.

Key challenges included:
- Running a background price simulation alongside a live API
- Ensuring prices, ticks, and history stayed consistent
- Debugging silent failures when routers or tables were missing
- Coordinating backend state with frontend polling

This significantly improved my debugging skills and system-level thinking.

---

## 💡 Most Interesting Part

The most interesting part was building the **market tick engine**.

Watching prices:
- Seed themselves into the database
- Update continuously
- Instantly reflect in the frontend

…was the moment the app truly felt *alive*.

---

## 🏗️ Tech Stack

### Backend
- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- JWT Authentication
- Passlib (bcrypt)

### Frontend
- React
- TypeScript
- Vite
- TanStack Query
- Axios

### Dev / Infra
- Docker (PostgreSQL)
- Shell scripts for local development
- Git & GitHub

---

## 🖥️ How to Run the Project (Local Development)

### Prereqs

You’ll need the following installed:

- Python 3.9+
- Node.js 18+
- Docker
- npm
