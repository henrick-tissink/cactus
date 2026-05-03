using System.Security.Cryptography;
using Cactus.Application.Common.Interfaces;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Auth.Commands;

public record VerifyEmailCommand(string Token) : IRequest<Unit>;

public class VerifyEmailCommandValidator : AbstractValidator<VerifyEmailCommand>
{
    public VerifyEmailCommandValidator()
    {
        RuleFor(x => x.Token).NotEmpty().WithMessage("Verification token is required");
    }
}

public class VerifyEmailCommandHandler : IRequestHandler<VerifyEmailCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public VerifyEmailCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(VerifyEmailCommand request, CancellationToken cancellationToken)
    {
        var tokenHash = Convert.ToBase64String(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(request.Token)));

        var user = await _context.Users
            .FirstOrDefaultAsync(u =>
                u.EmailVerificationTokenHash == tokenHash &&
                u.EmailVerificationTokenExpiresAt > DateTime.UtcNow,
                cancellationToken)
            ?? throw new InvalidOperationException("Invalid or expired verification token");

        user.IsEmailVerified = true;
        user.EmailVerificationTokenHash = null;
        user.EmailVerificationTokenExpiresAt = null;

        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
