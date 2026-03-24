namespace SlotMachine.Models;

public record SpinOutcome(SpinResult Result, BonusRoundState? NextBonusState);
