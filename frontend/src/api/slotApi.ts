export interface WinLine {
  lineId: number;
  symbol: string;
  count: number;
  payout: number;
  rows: number[];
}

export interface StickyPosition {
  reel: number;
  row: number;
}

export interface BonusState {
  active: boolean;
  freeSpinsRemaining: number;
  lockedBet: number;
  stickyWildPositions: StickyPosition[];
  spinsAwarded: number;
  totalBonusWin: number;
}

export type SpinMode = 'base' | 'bonus';

export interface SpinResult {
  reels: string[][];   // 5 arrays of 3 symbols
  winAmount: number;
  winningLines: WinLine[];
  isBonusTrigger: boolean;
  scatterCount: number;
  spinMode: SpinMode;
  bonusState: BonusState;
  isBonusComplete: boolean;
  completedBonusWinAmount: number;
  balance: number;
}

export interface DebugBonusRequest {
  bet: number;
  withStickyWilds: boolean;
}

export interface GameStateResponse {
  balance: number;
  bet: number;
  lastResult: SpinResult | null;
  bonusState: BonusState;
}

export async function spinReels(bet: number): Promise<SpinResult> {
  const response = await fetch('/api/spin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bet }),
  });

  if (!response.ok) {
    throw new Error(`Spin failed: ${response.statusText}`);
  }

  return response.json();
}

export async function getGameState(): Promise<GameStateResponse> {
  const response = await fetch('/api/state');

  if (!response.ok) {
    throw new Error(`State load failed: ${response.statusText}`);
  }

  return response.json();
}

export async function updateBet(bet: number): Promise<GameStateResponse> {
  const response = await fetch('/api/state/bet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bet }),
  });

  if (!response.ok) {
    throw new Error(`Bet update failed: ${response.statusText}`);
  }

  return response.json();
}

export async function startDebugBonus(request: DebugBonusRequest): Promise<BonusState> {
  const response = await fetch('/api/dev/bonus/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Debug bonus start failed: ${response.statusText}`);
  }

  return response.json();
}

export async function clearDebugBonus(): Promise<BonusState> {
  const response = await fetch('/api/dev/bonus/clear', {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Debug bonus clear failed: ${response.statusText}`);
  }

  return response.json();
}
