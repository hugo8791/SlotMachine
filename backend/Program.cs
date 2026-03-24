using SlotMachine.Models;
using SlotMachine.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<SlotService>();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

app.UseCors();

app.MapPost("/api/spin", (SpinRequest request, SlotService slotService) =>
{
    if (request.Bet < 1 || request.Bet > 10)
        return Results.BadRequest("Bet must be between 1 and 10.");

    var result = slotService.Spin(request.Bet);
    return Results.Ok(result);
});

app.Run();
