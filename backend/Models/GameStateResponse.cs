namespace SlotMachine.Models;

public record GameStateResponse(int Balance, int Bet, SpinResult? LastResult, BonusState BonusState);
