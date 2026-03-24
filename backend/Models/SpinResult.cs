namespace SlotMachine.Models;

public record WinLine(int LineId, string Symbol, int Count, int Payout, IReadOnlyList<int> Rows);

public record SpinResult(string[][] Reels, int WinAmount, IReadOnlyList<WinLine> WinningLines);
