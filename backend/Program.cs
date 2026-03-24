using SlotMachine.Models;
using SlotMachine.Extensions;
using SlotMachine.Services;

var builder = WebApplication.CreateBuilder(args);
const string BonusSessionKey = "bonus-round";

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
    var currentBonusState = httpContext.Session.GetJson<BonusRoundState>(BonusSessionKey);

    if (currentBonusState?.IsActive != true && (request.Bet < 1 || request.Bet > 10))
        return Results.BadRequest("Bet must be between 1 and 10.");

    var outcome = slotService.Spin(request.Bet, currentBonusState);

    if (outcome.NextBonusState?.IsActive == true)
        httpContext.Session.SetJson(BonusSessionKey, outcome.NextBonusState);
    else
        httpContext.Session.Remove(BonusSessionKey);

    return Results.Ok(outcome.Result);
});

if (app.Environment.IsDevelopment())
{
    app.MapPost("/api/dev/bonus/start", (DevBonusRequest request, HttpContext httpContext, SlotService slotService) =>
    {
        if (request.Bet < 1 || request.Bet > 10)
            return Results.BadRequest("Bet must be between 1 and 10.");

        var bonusRoundState = slotService.CreateDebugBonusState(request.Bet, request.WithStickyWilds);
        httpContext.Session.SetJson(BonusSessionKey, bonusRoundState);

        return Results.Ok(ToBonusStateResponse(bonusRoundState));
    });

    app.MapPost("/api/dev/bonus/clear", (HttpContext httpContext) =>
    {
        httpContext.Session.Remove(BonusSessionKey);
        return Results.Ok(EmptyBonusState());
    });
}

app.Run();

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
