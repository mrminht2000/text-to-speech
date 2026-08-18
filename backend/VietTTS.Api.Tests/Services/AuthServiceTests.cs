using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using VietTTS.Api.Data;
using VietTTS.Api.Data.Entities;
using VietTTS.Api.Models;
using VietTTS.Api.Services;

namespace VietTTS.Api.Tests.Services;

public class AuthServiceTests
{
    private (AppDbContext Db, IConfiguration Config, IQuotaService QuotaService, AuthService AuthService) CreateServices()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(options);

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "Jwt:SecretKey", "MinhTTS_Testing_Secret_Key_For_Jwt_Auth_2026_Development_Key_123456789!" },
                { "Jwt:Issuer", "MinhTTS.Api" },
                { "Jwt:Audience", "MinhTTS.Web" }
            })
            .Build();

        var quotaService = new QuotaService(db);
        var authService = new AuthService(db, config, quotaService);

        return (db, config, quotaService, authService);
    }

    [Fact]
    public async Task RegisterAsync_WithNewEmail_ShouldCreateUserAndReturnJwt()
    {
        var (db, _, _, authService) = CreateServices();
        var req = new RegisterRequest("testuser@minhtts.dev", "SecurePassword123!", "Nguyen Van A");

        var response = await authService.RegisterAsync(req);

        response.Should().NotBeNull();
        response!.Token.Should().NotBeNullOrWhiteSpace();
        response.User.Email.Should().Be("testuser@minhtts.dev");
        response.User.FullName.Should().Be("Nguyen Van A");
        response.User.Tier.Should().Be("free");
        response.User.Role.Should().Be("user");

        var userInDb = await db.Users.FirstOrDefaultAsync(u => u.Email == "testuser@minhtts.dev");
        userInDb.Should().NotBeNull();
        BCrypt.Net.BCrypt.Verify("SecurePassword123!", userInDb!.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task RegisterAsync_WithDuplicateEmail_ShouldReturnNull()
    {
        var (_, _, _, authService) = CreateServices();
        var req = new RegisterRequest("dup@minhtts.dev", "SecurePassword123!", "User 1");
        await authService.RegisterAsync(req);

        var duplicateResponse = await authService.RegisterAsync(new RegisterRequest("dup@minhtts.dev", "OtherPassword456!", "User 2"));

        duplicateResponse.Should().BeNull();
    }

    [Fact]
    public async Task LoginAsync_WithCorrectCredentials_ShouldReturnJwt()
    {
        var (_, _, _, authService) = CreateServices();
        await authService.RegisterAsync(new RegisterRequest("login@minhtts.dev", "MyPassword123", "Login Tester"));

        var response = await authService.LoginAsync(new LoginRequest("login@minhtts.dev", "MyPassword123"));

        response.Should().NotBeNull();
        response!.Token.Should().NotBeNullOrWhiteSpace();
        response.User.Email.Should().Be("login@minhtts.dev");
    }

    [Fact]
    public async Task LoginAsync_WithWrongPassword_ShouldReturnNull()
    {
        var (_, _, _, authService) = CreateServices();
        await authService.RegisterAsync(new RegisterRequest("wrong@minhtts.dev", "CorrectPassword123", "Tester"));

        var response = await authService.LoginAsync(new LoginRequest("wrong@minhtts.dev", "WrongPassword!"));

        response.Should().BeNull();
    }
}
