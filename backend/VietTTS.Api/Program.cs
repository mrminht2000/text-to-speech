using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using VietTTS.Api.Data;
using VietTTS.Api.Endpoints;
using VietTTS.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// Database — SQLite by default, configurable to PostgreSQL via connection string
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=minhtts.db";
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlite(connectionString);
});

// Authentication & JWT Bearer
var jwtSecret = builder.Configuration["Jwt:SecretKey"] ?? "MinhTTS_Super_Secret_Key_For_Jwt_Auth_2026_Development_Key_123456789!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "MinhTTS.Api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "MinhTTS.Web";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// CORS — allow frontend origin
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
                  "X-Audio-History-Id",
                  "Content-Disposition")));

// HttpClients
builder.Services.AddHttpClient("gemini", client =>
{
    client.BaseAddress = new Uri("https://generativelanguage.googleapis.com/");
    client.Timeout = TimeSpan.FromSeconds(60);
});

builder.Services.AddHttpClient("local_tts", client =>
{
    client.Timeout = TimeSpan.FromSeconds(120);
});

builder.Services.AddHttpClient("openai", client =>
{
    client.Timeout = TimeSpan.FromSeconds(60);
});

builder.Services.AddHttpClient("elevenlabs", client =>
{
    client.Timeout = TimeSpan.FromSeconds(60);
});

// TTS Services & Engine Factory
builder.Services.AddSingleton<IGeminiTtsService, GeminiTtsService>();
builder.Services.AddSingleton<ILocalTtsService, LocalTtsService>();
builder.Services.AddSingleton<IOpenAiTtsService, OpenAiTtsService>();
builder.Services.AddSingleton<IElevenLabsTtsService, ElevenLabsTtsService>();
builder.Services.AddSingleton<ITtsEngineFactory, TtsEngineFactory>();

// Phase 3: Auth, Quota, Storage Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IQuotaService, QuotaService>();
builder.Services.AddSingleton<IAudioStorageService, AudioStorageService>();

var app = builder.Build();

// Ensure Database Created & Seed Initial Admin
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();
    await db.SeedInitialDataAsync();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

// Endpoints Mapping
app.MapTtsEndpoints();
app.MapAuthEndpoints();
app.MapHistoryEndpoints();
app.MapAdminEndpoints();

app.Run();

public partial class Program { }
