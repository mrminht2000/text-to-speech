using System.Security.Claims;
using VietTTS.Api.Models;
using VietTTS.Api.Services;

namespace VietTTS.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Authentication");

        group.MapPost("/register", async (RegisterRequest req, IAuthService authService) =>
        {
            var result = await authService.RegisterAsync(req);
            if (result == null)
            {
                return Results.BadRequest(new { error = "Email này đã được đăng ký trong hệ thống." });
            }
            return Results.Ok(result);
        });

        group.MapPost("/login", async (LoginRequest req, IAuthService authService) =>
        {
            var result = await authService.LoginAsync(req);
            if (result == null)
            {
                return Results.BadRequest(new { error = "Email hoặc mật khẩu không chính xác." });
            }
            return Results.Ok(result);
        });

        group.MapPost("/google", async (GoogleAuthRequest req, IAuthService authService) =>
        {
            var result = await authService.GoogleLoginAsync(req);
            if (result == null)
            {
                return Results.BadRequest(new { error = "Đăng nhập bằng Google không thành công." });
            }
            return Results.Ok(result);
        });

        group.MapPost("/link-google", async (
            GoogleAuthRequest req,
            ClaimsPrincipal principal,
            IAuthService authService) =>
        {
            var user = await authService.GetUserFromClaimsAsync(principal);
            if (user == null) return Results.Unauthorized();

            var (success, error, updatedUser) = await authService.LinkGoogleAsync(user.Id, req);
            if (!success)
            {
                return Results.BadRequest(new { error });
            }
            return Results.Ok(updatedUser);
        }).RequireAuthorization();

        group.MapPost("/unlink-google", async (
            ClaimsPrincipal principal,
            IAuthService authService) =>
        {
            var user = await authService.GetUserFromClaimsAsync(principal);
            if (user == null) return Results.Unauthorized();

            var (success, error, updatedUser) = await authService.UnlinkGoogleAsync(user.Id);
            if (!success)
            {
                return Results.BadRequest(new { error });
            }
            return Results.Ok(updatedUser);
        }).RequireAuthorization();

        group.MapGet("/me", async (ClaimsPrincipal principal, IAuthService authService) =>
        {
            var user = await authService.GetUserFromClaimsAsync(principal);
            if (user == null)
            {
                return Results.Unauthorized();
            }
            return Results.Ok(authService.MapToUserDto(user));
        }).RequireAuthorization();
    }
}
