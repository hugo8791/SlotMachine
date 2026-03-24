namespace SlotMachine.Models;

public record WinLine(int LineId, string Symbol, int Count, int Payout, IReadOnlyList<int> Rows);

public record StickyPosition(int Reel, int Row);

public record BonusState(
    bool Active,
    int FreeSpinsRemaining,
    int LockedBet,
    IReadOnlyList<StickyPosition> StickyWildPositions,
    int SpinsAwarded,
    int TotalBonusWin
);

public record SpinResult(
    string[][] Reels,
    int WinAmount,
    IReadOnlyList<WinLine> WinningLines,
    bool IsBonusTrigger,
    int ScatterCount,
    string SpinMode,
    BonusState BonusState,
    bool IsBonusComplete,
    int CompletedBonusWinAmount,
    int Balance
);
