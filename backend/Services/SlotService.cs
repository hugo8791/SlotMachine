using SlotMachine.Models;

namespace SlotMachine.Services;

public class SlotService
{
    // Symbols ordered by value (low → high). Higher weight = appears more often.
    private static readonly (string Symbol, int Weight)[] WeightedSymbols =
    [
        ("🍒", 30),
        ("🍋", 25),
        ("🍇", 20),
        ("🔔", 12),
        ("💎", 8),
        ("⭐", 4),
        ("7️⃣", 1),
    ];

    // Payout multipliers: symbol → [match3, match4, match5]
    private static readonly Dictionary<string, int[]> Payouts = new()
    {
        ["🍒"]  = [5,   10,  20],
        ["🍋"]  = [8,   15,  30],
        ["🍇"]  = [10,  20,  40],
        ["🔔"]  = [15,  30,  60],
        ["💎"]  = [20,  40,  80],
        ["⭐"]  = [30,  60,  120],
        ["7️⃣"] = [50,  100, 200],
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
    private readonly Random _rng = new();

    public SpinResult Spin(int bet)
    {
        var grid = GenerateGrid();
        var (winAmount, winningLines) = EvaluatePaylines(grid, bet);
        return new SpinResult(grid, winAmount, winningLines);
    }

    private string[][] GenerateGrid()
    {
        var grid = new string[5][];
        for (int reel = 0; reel < 5; reel++)
        {
            grid[reel] = new string[3];
            for (int row = 0; row < 3; row++)
                grid[reel][row] = PickSymbol();
        }
        return grid;
    }

    private string PickSymbol()
    {
        int roll = _rng.Next(TotalWeight);
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
            var first = grid[0][line[0]];
            int count = 1;

            for (int reel = 1; reel < 5; reel++)
            {
                if (grid[reel][line[reel]] == first)
                    count++;
                else
                    break;
            }

            if (count >= 3 && Payouts.TryGetValue(first, out var payoutTable))
            {
                int multiplier = payoutTable[count - 3]; // index 0=match3, 1=match4, 2=match5
                int linePayout = multiplier * bet;
                totalWin += linePayout;
                winningLines.Add(new WinLine(i + 1, first, count, linePayout, line[..count]));
            }
        }

        return (totalWin, winningLines);
    }
}
