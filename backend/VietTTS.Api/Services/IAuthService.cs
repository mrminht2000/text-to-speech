using System.Security.Claims;
using VietTTS.Api.Data.Entities;
using VietTTS.Api.Models;

namespace VietTTS.Api.Services;

public interface IAuthService
{
    string GenerateJwtToken(User user);
    Task<AuthResponse?> RegisterAsync(RegisterRequest request);
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<AuthResponse?> GoogleLoginAsync(GoogleAuthRequest request);
    Task<(bool Success, string? Error, UserDto? User)> LinkGoogleAsync(Guid userId, GoogleAuthRequest request);
    Task<(bool Success, string? Error, UserDto? User)> UnlinkGoogleAsync(Guid userId);
    Task<UserDto?> GetCurrentUserDtoAsync(Guid userId);
    Task<User?> GetUserFromClaimsAsync(ClaimsPrincipal principal);
    UserDto MapToUserDto(User user);
}
