using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Cactus.Application.Common.Interfaces;
using Cactus.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Cactus.Infrastructure.Services;

public class JwtService : IJwtService
{
    private const int MinimumKeyLength = 32;
    private readonly IConfiguration _configuration;
    private readonly string _jwtKey;

    public JwtService(IConfiguration configuration)
    {
        _configuration = configuration;
        _jwtKey = GetAndValidateJwtKey();
    }

    private string GetAndValidateJwtKey()
    {
        var key = _configuration["Jwt:Key"];

        if (string.IsNullOrWhiteSpace(key))
        {
            throw new InvalidOperationException(
                "JWT Key is not configured. " +
                "Set the 'Jwt:Key' configuration value via environment variable 'Jwt__Key' or in appsettings.json. " +
                "For production, use: export Jwt__Key='your-secret-key-here'");
        }

        if (key.Length < MinimumKeyLength)
        {
            throw new InvalidOperationException(
                $"JWT Key must be at least {MinimumKeyLength} characters long for security. " +
                $"Current key length: {key.Length} characters.");
        }

        return key;
    }

    public string GenerateAccessToken(User user)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim("firstName", user.FirstName ?? ""),
            new Claim("lastName", user.LastName ?? "")
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    public bool ValidateRefreshToken(string token)
    {
        return !string.IsNullOrEmpty(token);
    }
}
