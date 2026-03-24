using SlotMachine.Models;
using SlotMachine.Extensions;
using SlotMachine.Services;

var builder = WebApplication.CreateBuilder(args);
const string BonusSessionKey = "bonus-round";
const string GameStateSessionKey = "game-state";
const int StartingBalance = 1000;
const int StartingBet = 1;

builder.Services.AddSingleton<SlotService>();
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromHours(4);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

app.UseCors();
app.UseSession();

app.MapPost("/api/spin", (SpinRequest request, HttpContext httpContext, SlotService slotService) =>
{
    var gameState = GetOrCreateGameState(httpContext.Session);
    var currentBonusState = httpContext.Session.GetJson<BonusRoundState>(BonusSessionKey);
    bool isBonusSpin = currentBonusState?.IsActive == true;
    int requestedBet = isBonusSpin ? currentBonusState!.LockedBet : request.Bet;

    if (!isBonusSpin && (requestedBet < 1 || requestedBet > 10))
        return Results.BadRequest("Bet must be between 1 and 10.");

    if (!isBonusSpin && gameState.Balance < requestedBet)
        return Results.BadRequest("Not enough credits.");

    var outcome = slotService.Spin(requestedBet, currentBonusState);
    int spinCost = isBonusSpin ? 0 : requestedBet;
    int nextBalance = gameState.Balance - spinCost + outcome.Result.WinAmount;

    var result = outcome.Result with { Balance = nextBalance };
    var nextGameState = gameState with
    {
        Balance = nextBalance,
        Bet = isBonusSpin ? gameState.Bet : requestedBet,
        LastResult = result
    };

    httpContext.Session.SetJson(GameStateSessionKey, nextGameState);

    if (outcome.NextBonusState?.IsActive == true)
        httpContext.Session.SetJson(BonusSessionKey, outcome.NextBonusState);
    else
        httpContext.Session.Remove(BonusSessionKey);

    return Results.Ok(result);
});

app.MapGet("/api/state", (HttpContext httpContext) =>
{
    var gameState = GetOrCreateGameState(httpContext.Session);
    var bonusRoundState = httpContext.Session.GetJson<BonusRoundState>(BonusSessionKey);

    return Results.Ok(new GameStateResponse(
        gameState.Balance,
        gameState.Bet,
        gameState.LastResult,
        bonusRoundState is null ? EmptyBonusState() : ToBonusStateResponse(bonusRoundState)
    ));
});

app.MapPost("/api/state/bet", (BetUpdateRequest request, HttpContext httpContext) =>
{
    if (request.Bet < 1 || request.Bet > 10)
        return Results.BadRequest("Bet must be between 1 and 10.");

    var gameState = GetOrCreateGameState(httpContext.Session);
    var bonusRoundState = httpContext.Session.GetJson<BonusRoundState>(BonusSessionKey);

    if (bonusRoundState?.IsActive == true)
        return Results.BadRequest("Cannot change bet during an active bonus.");

    var nextGameState = gameState with { Bet = request.Bet };
    httpContext.Session.SetJson(GameStateSessionKey, nextGameState);

    return Results.Ok(new GameStateResponse(
        nextGameState.Balance,
        nextGameState.Bet,
        nextGameState.LastResult,
        EmptyBonusState()
    ));
});

if (app.Environment.IsDevelopment())
{
    app.MapPost("/api/dev/bonus/start", (DevBonusRequest request, HttpContext httpContext, SlotService slotService) =>
    {
        if (request.Bet < 1 || request.Bet > 10)
            return Results.BadRequest("Bet must be between 1 and 10.");

        var gameState = GetOrCreateGameState(httpContext.Session);
        var bonusRoundState = slotService.CreateDebugBonusState(request.Bet, request.WithStickyWilds);
        httpContext.Session.SetJson(BonusSessionKey, bonusRoundState);
        httpContext.Session.SetJson(GameStateSessionKey, gameState with { Bet = request.Bet });

        return Results.Ok(ToBonusStateResponse(bonusRoundState));
    });

    app.MapPost("/api/dev/bonus/clear", (HttpContext httpContext) =>
    {
        httpContext.Session.Remove(BonusSessionKey);
        return Results.Ok(EmptyBonusState());
    });
}

app.Run();

static GameSessionState GetOrCreateGameState(ISession session)
{
    var gameState = session.GetJson<GameSessionState>(GameStateSessionKey);
    if (gameState is not null)
        return gameState;

    var initialState = new GameSessionState(StartingBalance, StartingBet, null);
    session.SetJson(GameStateSessionKey, initialState);
    return initialState;
}

static BonusState ToBonusStateResponse(BonusRoundState bonusRoundState) =>
    new(
        Active: bonusRoundState.IsActive,
        FreeSpinsRemaining: bonusRoundState.FreeSpinsRemaining,
        LockedBet: bonusRoundState.LockedBet,
        StickyWildPositions: bonusRoundState.StickyWildPositions,
        SpinsAwarded: 0,
        TotalBonusWin: bonusRoundState.TotalBonusWin
    );

static BonusState EmptyBonusState() =>
    new(
        Active: false,
        FreeSpinsRemaining: 0,
        LockedBet: 0,
        StickyWildPositions: Array.Empty<StickyPosition>(),
        SpinsAwarded: 0,
        TotalBonusWin: 0
    );
