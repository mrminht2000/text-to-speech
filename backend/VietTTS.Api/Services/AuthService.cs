using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using VietTTS.Api.Data;
using VietTTS.Api.Data.Entities;
using VietTTS.Api.Models;

namespace VietTTS.Api.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly IQuotaService _quotaService;

    public AuthService(AppDbContext db, IConfiguration config, IQuotaService quotaService)
    {
        _db = db;
        _config = config;
        _quotaService = quotaService;
    }

    public string GenerateJwtToken(User user)
    {
        var secret = _config["Jwt:SecretKey"] ?? "MinhTTS_Super_Secret_Key_For_Jwt_Auth_2026_Development_Key_123456789!";
        var issuer = _config["Jwt:Issuer"] ?? "MinhTTS.Api";
        var audience = _config["Jwt:Audience"] ?? "MinhTTS.Web";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Name, user.FullName ?? user.Email),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("tier", user.Tier.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(30),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(u => u.Email == normalizedEmail))
        {
            return null; // User already exists
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = string.IsNullOrWhiteSpace(request.FullName) ? normalizedEmail.Split('@')[0] : request.FullName.Trim(),
            Role = UserRole.User,
            Tier = UserTier.Free,
            DailyTokensUsed = 0,
            LastUsageDate = DateOnly.FromDateTime(DateTime.UtcNow),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _db.Users.AddAsync(user);
        await _db.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        return new AuthResponse(token, MapToUserDto(user));
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        if (user == null || string.IsNullOrEmpty(user.PasswordHash))
        {
            return null;
        }

        var isMatch = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!isMatch)
        {
            var computedClientHash = AppDbContext.ComputeClientHash(request.Password);
            isMatch = BCrypt.Net.BCrypt.Verify(computedClientHash, user.PasswordHash);
        }

        if (!isMatch)
        {
            return null;
        }

        await _quotaService.EnsureDailyResetAsync(user);

        var token = GenerateJwtToken(user);
        return new AuthResponse(token, MapToUserDto(user));
    }

    private static (string? Email, string? Sub, string? Name, string? Picture) ParseGoogleCredential(string credential, string? email, string? name, string? picture)
    {
        var parsedEmail = email;
        var parsedSub = credential;
        var parsedName = name;
        var parsedPicture = picture;

        try
        {
            var parts = credential.Split('.');
            if (parts.Length == 3)
            {
                var payloadBase64 = parts[1].Replace('-', '+').Replace('_', '/');
                switch (payloadBase64.Length % 4)
                {
                    case 2: payloadBase64 += "=="; break;
                    case 3: payloadBase64 += "="; break;
                }
                var jsonBytes = Convert.FromBase64String(payloadBase64);
                using var doc = JsonDocument.Parse(jsonBytes);
                var root = doc.RootElement;

                if (string.IsNullOrEmpty(parsedEmail) && root.TryGetProperty("email", out var emailProp))
                    parsedEmail = emailProp.GetString();
                if (root.TryGetProperty("sub", out var subProp))
                    parsedSub = subProp.GetString() ?? parsedSub;
                if (string.IsNullOrEmpty(parsedName) && root.TryGetProperty("name", out var nameProp))
                    parsedName = nameProp.GetString();
                if (string.IsNullOrEmpty(parsedPicture) && root.TryGetProperty("picture", out var picProp))
                    parsedPicture = picProp.GetString();
            }
        }
        catch
        {
            // Fallback to provided fields if parsing fails
        }

        return (parsedEmail, parsedSub, parsedName, parsedPicture);
    }

    public async Task<AuthResponse?> GoogleLoginAsync(GoogleAuthRequest request)
    {
        var (email, sub, name, picture) = ParseGoogleCredential(request.Credential, request.Email, request.FullName, request.AvatarUrl);

        if (string.IsNullOrWhiteSpace(email))
        {
            return null;
        }

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.GoogleId == sub || u.Email == normalizedEmail);

        if (user == null)
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                Email = normalizedEmail,
                FullName = string.IsNullOrWhiteSpace(name) ? normalizedEmail.Split('@')[0] : name.Trim(),
                AvatarUrl = picture,
                GoogleId = sub,
                Role = UserRole.User,
                Tier = UserTier.Free,
                DailyTokensUsed = 0,
                LastUsageDate = DateOnly.FromDateTime(DateTime.UtcNow),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _db.Users.AddAsync(user);
        }
        else
        {
            // Link GoogleId if not already set
            if (string.IsNullOrEmpty(user.GoogleId))
            {
                user.GoogleId = sub;
            }
            if (!string.IsNullOrEmpty(picture) && string.IsNullOrEmpty(user.AvatarUrl))
                user.AvatarUrl = picture;
            if (!string.IsNullOrEmpty(name) && string.IsNullOrEmpty(user.FullName))
                user.FullName = name;
            user.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        await _quotaService.EnsureDailyResetAsync(user);

        var token = GenerateJwtToken(user);
        return new AuthResponse(token, MapToUserDto(user));
    }

    public async Task<(bool Success, string? Error, UserDto? User)> LinkGoogleAsync(Guid userId, GoogleAuthRequest request)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return (false, "Không tìm thấy người dùng.", null);

        var (email, sub, name, picture) = ParseGoogleCredential(request.Credential, request.Email, request.FullName, request.AvatarUrl);

        if (string.IsNullOrWhiteSpace(sub))
        {
            return (false, "Thông tin xác thực Google không hợp lệ.", null);
        }

        // Check if another user is already linked with this Google account
        var existing = await _db.Users.FirstOrDefaultAsync(u => u.GoogleId == sub && u.Id != userId);
        if (existing != null)
        {
            return (false, "Tài khoản Google này đã được liên kết với một tài khoản khác trong hệ thống.", null);
        }

        user.GoogleId = sub;
        if (!string.IsNullOrEmpty(picture) && string.IsNullOrEmpty(user.AvatarUrl))
        {
            user.AvatarUrl = picture;
        }
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return (true, null, MapToUserDto(user));
    }

    public async Task<(bool Success, string? Error, UserDto? User)> UnlinkGoogleAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return (false, "Không tìm thấy người dùng.", null);

        if (string.IsNullOrEmpty(user.GoogleId))
        {
            return (false, "Tài khoản chưa được liên kết với Google.", null);
        }

        if (string.IsNullOrEmpty(user.PasswordHash))
        {
            // Set a default password or notify user so they don't get locked out
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(AppDbContext.ComputeClientHash("MinhTTS@2026"));
        }

        user.GoogleId = null;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return (true, null, MapToUserDto(user));
    }

    public async Task<UserDto?> GetCurrentUserDtoAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return null;

        await _quotaService.EnsureDailyResetAsync(user);
        return MapToUserDto(user);
    }

    public async Task<User?> GetUserFromClaimsAsync(ClaimsPrincipal principal)
    {
        var userIdStr = principal.FindFirstValue(ClaimTypes.NameIdentifier) 
                     ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
        {
            return null;
        }

        return await _db.Users.FindAsync(userId);
    }

    public UserDto MapToUserDto(User user)
    {
        var dailyLimit = _quotaService.GetDailyTokenLimit(user.Tier);
        var maxWords = _quotaService.GetMaxWordsPerRequest(user.Tier);
        var remaining = dailyLimit >= 100000000 ? int.MaxValue : Math.Max(0, dailyLimit - user.DailyTokensUsed);

        return new UserDto(
            Id: user.Id,
            Email: user.Email,
            FullName: user.FullName,
            AvatarUrl: user.AvatarUrl,
            IsGoogleLinked: !string.IsNullOrEmpty(user.GoogleId),
            Role: user.Role.ToString().ToLowerInvariant(),
            Tier: user.Tier.ToString().ToLowerInvariant(),
            DailyTokensUsed: user.DailyTokensUsed,
            DailyTokenLimit: dailyLimit,
            MaxWordsPerRequest: maxWords,
            RemainingTokensToday: remaining,
            CreatedAt: user.CreatedAt
        );
    }
}
