using System.Security.Cryptography;
using Cactus.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Auth.Commands;

public record ResendVerificationCommand : IRequest<Unit>;

public class ResendVerificationCommandHandler : IRequestHandler<ResendVerificationCommand, Unit>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IEmailService _emailService;

    public ResendVerificationCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IEmailService emailService)
    {
        _context = context;
        _currentUser = currentUser;
        _emailService = emailService;
    }

    public async Task<Unit> Handle(ResendVerificationCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new KeyNotFoundException("User not found");

        if (user.IsEmailVerified)
            return Unit.Value;

        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var tokenHash = Convert.ToBase64String(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token)));

        user.EmailVerificationTokenHash = tokenHash;
        user.EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddHours(24);

        await _context.SaveChangesAsync(cancellationToken);

        await _emailService.SendEmailVerificationAsync(user.Email, token, cancellationToken);

        return Unit.Value;
    }
}
