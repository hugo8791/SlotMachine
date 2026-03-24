# SlotMachine WebApp — Design Spec

**Date**: 2026-03-24
**Status**: Approved

---

## Context

Learning/portfolio project. Build a functional 5-reel video slot machine with spin logic on a .NET backend and a React frontend. Session-based virtual credits — no real money, no auth, no database.

---

## Architecture

```
┌─────────────────────┐         ┌──────────────────────────┐
│   React + Vite (TS) │ ──POST──▶  .NET 8 Minimal API (C#) │
│   localhost:5173    │ ◀──JSON── localhost:5000/api/spin   │
└─────────────────────┘         └──────────────────────────┘
```

- **Frontend**: React + Vite + TypeScript. Session state (balance) in React useState.
- **Backend**: .NET 8 Minimal API. Single endpoint `POST /api/spin`.
- **Communication**: JSON over HTTP. Vite proxy handles `/api` → backend in dev.
- **No database**: Stateless. Balance lives in the browser.

---

## Game Mechanics

**Grid**: 5 reels × 3 rows = 15 visible symbols.

**Symbols** (ordered by value):

| Symbol | Name    | Match 3 | Match 4 | Match 5 |
|--------|---------|---------|---------|---------|
| 🍒     | Cherry  | 5×      | 10×     | 20×     |
| 🍋     | Lemon   | 8×      | 15×     | 30×     |
| 🍇     | Grape   | 10×     | 20×     | 40×     |
| 🔔     | Bell    | 15×     | 30×     | 60×     |
| 💎     | Diamond | 20×     | 40×     | 80×     |
| ⭐     | Star    | 30×     | 60×     | 120×    |
| 7️⃣    | Seven   | 50×     | 100×    | 200×    |

**Paylines**: 20 fixed paylines (horizontal, diagonal, zigzag across 3 rows).

**Bet**: 1–10 credits. Starting balance: 1000 credits.

**Win logic** (backend): check each payline for 3/4/5 matching symbols from left. Total win = sum of matched payline wins × bet.

**RTP**: ~95% via symbol weights.

---

## API Contract

```
POST /api/spin
Content-Type: application/json

Request:
{ "bet": 5 }

Response:
{
  "reels": [
    ["🍒", "💎", "🍋"],
    ["🍒", "🍋", "🔔"],
    ["🍒", "⭐", "7️⃣"],
    ["🍋", "🍒", "💎"],
    ["🍒", "🍇", "🔔"]
  ],
  "winAmount": 100,
  "winningLines": [
    { "lineId": 1, "symbol": "🍒", "count": 5, "payout": 100 }
  ]
}
```

---

## Backend Structure

```
backend/
├── SlotMachine.Api.csproj
├── Program.cs               # app setup, CORS, POST /api/spin
├── Models/
│   ├── SpinRequest.cs       # { int Bet }
│   └── SpinResult.cs        # { string[][] Reels, int WinAmount, WinLine[] WinningLines }
└── Services/
    └── SlotService.cs       # RNG, symbol weights, payline definitions, win calc
```

**SlotService responsibilities**:
- Define symbols with weighted probabilities (lower value = higher frequency)
- Define 20 payline coordinate arrays (`[reel, row]` pairs)
- `SpinResult Spin(int bet)`: generate 5×3 grid, evaluate all paylines, return result

---

## Frontend Structure

```
frontend/src/
├── api/
│   └── slotApi.ts           # fetch POST /api/spin, typed request/response
├── hooks/
│   └── useSlotGame.ts       # balance, bet, spinning state + spin handler
├── components/
│   ├── Reel.tsx             # 3-symbol column, GSAP animation ref
│   ├── SlotMachine.tsx      # 5× Reel + PaylineOverlay
│   ├── PaylineOverlay.tsx   # SVG/CSS lines highlighting wins
│   ├── BetControls.tsx      # bet selector buttons
│   ├── SpinButton.tsx       # disabled during spin
│   ├── BalanceDisplay.tsx   # current credits display
│   └── WinModal.tsx         # big win overlay (>50 credits)
└── App.tsx
```

**GSAP animation flow**:
1. Spin pressed → all 5 reels start spinning (looping upward CSS transform)
2. API call completes → result held until animation minimum time
3. Reels stop left→right, staggered 0.3s each, snapping to result symbols
4. Winning lines highlighted → WinModal if win > 50 credits

---

## Out of Scope (MVP)

- Authentication / user accounts
- Persistent balance (DB/localStorage)
- Sound effects
- Mobile layout
- Bonus rounds / free spins
- Leaderboard
