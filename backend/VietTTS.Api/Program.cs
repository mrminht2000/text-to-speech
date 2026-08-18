using VietTTS.Api.Services;
using VietTTS.Api.Endpoints;

var builder = WebApplication.CreateBuilder(args);

// Services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// CORS — allow frontend origin
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
                    ?? ["http://localhost:5173"];
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
              .WithExposedHeaders(
                  "X-Usage-Prompt-Tokens",
                  "X-Usage-Candidates-Tokens",
                  "X-Usage-Total-Tokens",
                  "Content-Disposition")));

// HttpClient for Gemini API
builder.Services.AddHttpClient("gemini", client =>
{
    client.BaseAddress = new Uri("https://generativelanguage.googleapis.com/");
    client.Timeout = TimeSpan.FromSeconds(60);
});

// TTS service
builder.Services.AddSingleton<IGeminiTtsService, GeminiTtsService>();

var app = builder.Build();

app.UseCors();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.MapTtsEndpoints();

app.Run();

public partial class Program { }
