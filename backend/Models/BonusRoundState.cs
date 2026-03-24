namespace SlotMachine.Models;

public record BonusRoundState(
    int FreeSpinsRemaining,
    int LockedBet,
    IReadOnlyList<StickyPosition> StickyWildPositions,
    int TotalBonusWin
)
{
    public bool IsActive => FreeSpinsRemaining > 0;
}
