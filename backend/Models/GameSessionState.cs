namespace SlotMachine.Models;

public record GameSessionState(int Balance, int Bet, SpinResult? LastResult);
