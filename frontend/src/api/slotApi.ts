export interface WinLine {
  lineId: number;
  symbol: string;
  count: number;
  payout: number;
  rows: number[];
}

export interface SpinResult {
  reels: string[][];   // 5 arrays of 3 symbols
  winAmount: number;
  winningLines: WinLine[];
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
