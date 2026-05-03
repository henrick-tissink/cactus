using System.Security.Cryptography;
using Cactus.Application.Common.Interfaces;
using Cactus.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Auth.Commands;

public record RegisterCommand(
    string Email,
    string Password,
    string? FirstName,
    string? LastName
) : IRequest<RegisterResult>;

public record RegisterResult(
    Guid UserId,
    string Email,
    string? FirstName,
    string? LastName,
    bool IsOnboardingComplete,
    bool IsEmailVerified,
    string AccessToken,
    string RefreshToken
);

public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format")
            .MaximumLength(255);

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters")
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter")
            .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter")
            .Matches("[0-9]").WithMessage("Password must contain at least one digit");

        RuleFor(x => x.FirstName)
            .MaximumLength(100);

        RuleFor(x => x.LastName)
            .MaximumLength(100);
    }
}

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, RegisterResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtService _jwtService;
    private readonly IEmailService _emailService;

    public RegisterCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtService jwtService,
        IEmailService emailService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
        _emailService = emailService;
    }

    public async Task<RegisterResult> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        // Check if email already exists
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);

        if (existingUser != null)
        {
            throw new InvalidOperationException("Email already registered");
        }

        // Create user
        var user = new User
        {
            Email = request.Email.ToLower(),
            PasswordHash = _passwordHasher.Hash(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            IsOnboardingComplete = false
        };

        _context.Users.Add(user);

        // Create refresh token
        var refreshTokenValue = _jwtService.GenerateRefreshToken();
        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = refreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        _context.RefreshTokens.Add(refreshToken);

        // Generate email verification token
        var verificationToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var verificationTokenHash = Convert.ToBase64String(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(verificationToken)));
        user.EmailVerificationTokenHash = verificationTokenHash;
        user.EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddHours(24);

        await _context.SaveChangesAsync(cancellationToken);

        // Send verification email
        await _emailService.SendEmailVerificationAsync(user.Email, verificationToken, CancellationToken.None);

        // Generate access token
        var accessToken = _jwtService.GenerateAccessToken(user);

        return new RegisterResult(
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.IsOnboardingComplete,
            user.IsEmailVerified,
            accessToken,
            refreshTokenValue
        );
    }
}
