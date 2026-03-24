using SlotMachine.Models;

namespace SlotMachine.Services;

public class SlotService
{
    private const string CherrySymbol = "🍒";
    private const string LemonSymbol = "🍋";
    private const string GrapeSymbol = "🍇";
    private const string BellSymbol = "🔔";
    private const string DiamondSymbol = "💎";
    private const string StarSymbol = "⭐";
    private const string WildSymbol = "🃏";
    private const string SevenSymbol = "7️⃣";
    private const string ScatterSymbol = "🎁";
    private const int BonusTriggerCount = 3;
    private const int FreeSpinsAward = 10;
    private const int RetriggerAward = 5;
    private static readonly StickyPosition[] DebugStickyWildPositions =
    [
        new(0, 1),
        new(2, 0),
        new(4, 2),
    ];

    // Symbols ordered by value (low → high). Higher weight = appears more often.
    private static readonly (string Symbol, int Weight)[] WeightedSymbols =
    [
        (CherrySymbol, 30),
        (LemonSymbol, 25),
        (GrapeSymbol, 20),
        (BellSymbol, 12),
        (DiamondSymbol, 8),
        (StarSymbol, 4),
        (ScatterSymbol, 3),
        (WildSymbol, 2),
        (SevenSymbol, 1),
    ];

    // Payout multipliers: symbol → [match3, match4, match5]
    private static readonly Dictionary<string, int[]> Payouts = new()
    {
        [CherrySymbol] = [5,   10,  20],
        [LemonSymbol] = [8,   15,  30],
        [GrapeSymbol] = [10,  20,  40],
        [BellSymbol] = [15,  30,  60],
        [DiamondSymbol] = [20,  40,  80],
        [StarSymbol] = [30,  60,  120],
        [WildSymbol] = [75,  150, 300],
        [SevenSymbol] = [50,  100, 200],
    };

    // 20 paylines: each is an array of 5 row indices (0=top, 1=mid, 2=bottom), one per reel.
    private static readonly int[][] Paylines =
    [
        [1, 1, 1, 1, 1], // line 1  — middle row
        [0, 0, 0, 0, 0], // line 2  — top row
        [2, 2, 2, 2, 2], // line 3  — bottom row
        [0, 1, 2, 1, 0], // line 4  — V shape
        [2, 1, 0, 1, 2], // line 5  — inverted V
        [0, 0, 1, 2, 2], // line 6  — diagonal down
        [2, 2, 1, 0, 0], // line 7  — diagonal up
        [1, 0, 0, 0, 1], // line 8
        [1, 2, 2, 2, 1], // line 9
        [0, 1, 0, 1, 0], // line 10
        [2, 1, 2, 1, 2], // line 11
        [1, 0, 1, 0, 1], // line 12
        [1, 2, 1, 2, 1], // line 13
        [0, 0, 0, 1, 2], // line 14
        [2, 2, 2, 1, 0], // line 15
        [0, 1, 2, 2, 2], // line 16
        [2, 1, 0, 0, 0], // line 17
        [0, 0, 1, 0, 0], // line 18
        [2, 2, 1, 2, 2], // line 19
        [1, 1, 0, 1, 1], // line 20
    ];

    private static readonly int TotalWeight = WeightedSymbols.Sum(s => s.Weight);

    public SpinOutcome Spin(int requestedBet, BonusRoundState? currentBonusState)
    {
        bool isBonusSpin = currentBonusState?.IsActive == true;
        int bet = isBonusSpin ? currentBonusState!.LockedBet : requestedBet;
        var startingStickyPositions = isBonusSpin
            ? currentBonusState!.StickyWildPositions
            : Array.Empty<StickyPosition>();

        var grid = GenerateGrid(startingStickyPositions);
        int scatterCount = CountSymbols(grid, ScatterSymbol);
        var (winAmount, winningLines) = EvaluatePaylines(grid, bet);

        bool isBonusTrigger = !isBonusSpin && scatterCount >= BonusTriggerCount;
        bool isBonusComplete = false;
        int completedBonusWinAmount = 0;
        int spinsAwarded = 0;
        BonusRoundState? nextBonusState = null;

        if (isBonusSpin)
        {
            var stickyWildPositions = CollectStickyWildPositions(grid, currentBonusState!.StickyWildPositions);
            int freeSpinsRemaining = currentBonusState.FreeSpinsRemaining - 1;
            int totalBonusWin = currentBonusState.TotalBonusWin + winAmount;

            if (scatterCount >= BonusTriggerCount)
            {
                freeSpinsRemaining += RetriggerAward;
                spinsAwarded = RetriggerAward;
            }

            if (freeSpinsRemaining > 0)
            {
                nextBonusState = new BonusRoundState(
                    freeSpinsRemaining,
                    currentBonusState.LockedBet,
                    stickyWildPositions,
                    totalBonusWin
                );
            }
            else
            {
                isBonusComplete = true;
                completedBonusWinAmount = totalBonusWin;
            }
        }
        else if (isBonusTrigger)
        {
            spinsAwarded = FreeSpinsAward;
            nextBonusState = new BonusRoundState(
                FreeSpinsAward,
                bet,
                Array.Empty<StickyPosition>(),
                0
            );
        }

        var bonusState = new BonusState(
            Active: nextBonusState?.IsActive == true,
            FreeSpinsRemaining: nextBonusState?.FreeSpinsRemaining ?? 0,
            LockedBet: nextBonusState?.LockedBet ?? 0,
            StickyWildPositions: nextBonusState?.StickyWildPositions ?? Array.Empty<StickyPosition>(),
            SpinsAwarded: spinsAwarded,
            TotalBonusWin: nextBonusState?.TotalBonusWin ?? (isBonusComplete ? completedBonusWinAmount : 0)
        );

        var result = new SpinResult(
            grid,
            winAmount,
            winningLines,
            isBonusTrigger,
            scatterCount,
            isBonusSpin ? "bonus" : "base",
            bonusState,
            isBonusComplete,
            completedBonusWinAmount
        );

        return new SpinOutcome(result, nextBonusState);
    }

    public BonusRoundState CreateDebugBonusState(int bet, bool withStickyWilds) =>
        new(
            FreeSpinsAward,
            bet,
            withStickyWilds ? DebugStickyWildPositions : Array.Empty<StickyPosition>(),
            0
        );

    private string[][] GenerateGrid(IReadOnlyList<StickyPosition> stickyWildPositions)
    {
        var grid = new string[5][];
        for (int reel = 0; reel < 5; reel++)
        {
            grid[reel] = new string[3];
            for (int row = 0; row < 3; row++)
                grid[reel][row] = PickSymbol();
        }

        foreach (var position in stickyWildPositions)
            grid[position.Reel][position.Row] = WildSymbol;

        return grid;
    }

    private string PickSymbol()
    {
        int roll = Random.Shared.Next(TotalWeight);
        int cumulative = 0;
        foreach (var (symbol, weight) in WeightedSymbols)
        {
            cumulative += weight;
            if (roll < cumulative) return symbol;
        }
        return WeightedSymbols[^1].Symbol;
    }

    private static (int WinAmount, List<WinLine> WinningLines) EvaluatePaylines(string[][] grid, int bet)
    {
        var winningLines = new List<WinLine>();
        int totalWin = 0;

        for (int i = 0; i < Paylines.Length; i++)
        {
            var line = Paylines[i];
            var lineSymbols = Enumerable.Range(0, 5)
                .Select(reel => grid[reel][line[reel]])
                .ToArray();
            var symbol = ResolveWinningSymbol(lineSymbols, out int count);

            if (count >= 3 && Payouts.TryGetValue(symbol, out var payoutTable))
            {
                int multiplier = payoutTable[count - 3]; // index 0=match3, 1=match4, 2=match5
                int linePayout = multiplier * bet;
                totalWin += linePayout;
                winningLines.Add(new WinLine(i + 1, symbol, count, linePayout, line[..count]));
            }
        }

        return (totalWin, winningLines);
    }

    private static int CountSymbols(string[][] grid, string symbol) =>
        grid.Sum(reel => reel.Count(current => current == symbol));

    private static IReadOnlyList<StickyPosition> CollectStickyWildPositions(
        string[][] grid,
        IReadOnlyList<StickyPosition> existingStickyWildPositions
    )
    {
        var positions = new HashSet<StickyPosition>(existingStickyWildPositions);

        for (int reel = 0; reel < grid.Length; reel++)
        {
            for (int row = 0; row < grid[reel].Length; row++)
            {
                if (grid[reel][row] == WildSymbol)
                    positions.Add(new StickyPosition(reel, row));
            }
        }

        return positions
            .OrderBy(position => position.Reel)
            .ThenBy(position => position.Row)
            .ToArray();
    }

    private static string ResolveWinningSymbol(IReadOnlyList<string> lineSymbols, out int count)
    {
        string? resolvedSymbol = null;
        count = 0;

        foreach (var symbol in lineSymbols)
        {
            if (resolvedSymbol is null)
            {
                count++;

                // Leading wilds stay unresolved until we encounter a concrete symbol.
                if (symbol != WildSymbol)
                {
                    resolvedSymbol = symbol;
                }

                continue;
            }

            if (IsMatchingSymbol(resolvedSymbol, symbol))
            {
                count++;
                continue;
            }

            break;
        }

        return resolvedSymbol ?? WildSymbol;
    }

    private static bool IsMatchingSymbol(string resolvedSymbol, string nextSymbol)
    {
        if (resolvedSymbol == ScatterSymbol)
            return nextSymbol == ScatterSymbol;

        return nextSymbol == resolvedSymbol || nextSymbol == WildSymbol;
    }
}
