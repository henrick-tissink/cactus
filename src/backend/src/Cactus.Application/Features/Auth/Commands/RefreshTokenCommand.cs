using Cactus.Application.Common.Interfaces;
using Cactus.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Auth.Commands;

public record RefreshTokenCommand(string RefreshToken) : IRequest<RefreshTokenResult>;

public record RefreshTokenResult(string AccessToken, string RefreshToken);

public class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh token is required");
    }
}

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, RefreshTokenResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtService _jwtService;

    public RefreshTokenCommandHandler(IApplicationDbContext context, IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    public async Task<RefreshTokenResult> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var token = await _context.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == request.RefreshToken, cancellationToken);

        if (token == null)
        {
            throw new UnauthorizedAccessException("Invalid refresh token");
        }

        if (token.IsRevoked)
        {
            throw new UnauthorizedAccessException("Token has been revoked");
        }

        if (token.ExpiresAt < DateTime.UtcNow)
        {
            throw new UnauthorizedAccessException("Token has expired");
        }

        // Rotate token
        token.IsRevoked = true;
        token.RevokedAt = DateTime.UtcNow;
        token.RevokedReason = "Token rotation";

        var newRefreshTokenValue = _jwtService.GenerateRefreshToken();
        var newRefreshToken = new RefreshToken
        {
            UserId = token.UserId,
            Token = newRefreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        token.ReplacedByToken = newRefreshTokenValue;

        _context.RefreshTokens.Add(newRefreshToken);
        await _context.SaveChangesAsync(cancellationToken);

        var accessToken = _jwtService.GenerateAccessToken(token.User);

        return new RefreshTokenResult(accessToken, newRefreshTokenValue);
    }
}
