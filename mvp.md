# SlotMachine — MVP

## What we're building

A 5-reel video slot machine web app. Learning/portfolio project. No real money, no auth, no database.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript |
| Backend | .NET 8 Minimal API (C#) |
| Animation | GSAP |
| Architecture | REST API, stateless |

## Game Rules

- **Grid**: 5 reels × 3 rows = 15 visible symbols
- **Paylines**: 20 fixed paylines
- **Starting balance**: 1000 credits
- **Bet options**: 1 / 2 / 5 / 10 credits per spin

### Symbols & Payouts (× bet per credit)

| Symbol | Name    | Match 3 | Match 4 | Match 5 |
|--------|---------|---------|---------|---------|
| 🍒     | Cherry  | 5×      | 10×     | 20×     |
| 🍋     | Lemon   | 8×      | 15×     | 30×     |
| 🍇     | Grape   | 10×     | 20×     | 40×     |
| 🔔     | Bell    | 15×     | 30×     | 60×     |
| 💎     | Diamond | 20×     | 40×     | 80×     |
| ⭐     | Star    | 30×     | 60×     | 120×    |
| 7️⃣    | Seven   | 50×     | 100×    | 200×    |

Win condition: 3, 4, or 5 matching symbols from left on any payline.

RTP: ~95% via weighted symbol distribution on the backend.

## API

```
POST /api/spin
Body:     { "bet": 5 }
Response: {
  "reels": [["🍒","💎","🍋"], ...],    // 5 arrays of 3 symbols
  "winAmount": 100,
  "winningLines": [
    { "lineId": 1, "symbol": "🍒", "count": 5, "payout": 100 }
  ]
}
```

## Frontend Components

| Component | Purpose |
|-----------|---------|
| `BalanceDisplay` | Shows current credits |
| `SlotMachine` | Container for 5 reels + payline overlay |
| `Reel` × 5 | 3-symbol column, GSAP spin animation |
| `PaylineOverlay` | Highlights winning lines |
| `BetControls` | Bet selector (1/2/5/10) |
| `SpinButton` | Triggers spin, disabled during animation |
| `WinModal` | Overlay for wins > 50 credits |

## Out of Scope (MVP)

- Authentication / user accounts
- Real money / payments
- Leaderboard / history
- Mobile-optimized layout
- Sound effects
- Bonus rounds / free spins
