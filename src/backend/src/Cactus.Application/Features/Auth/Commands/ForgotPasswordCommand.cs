using System.Security.Cryptography;
using Cactus.Application.Common.Interfaces;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Auth.Commands;

public record ForgotPasswordCommand(string Email) : IRequest<Unit>;

public class ForgotPasswordCommandValidator : AbstractValidator<ForgotPasswordCommand>
{
    public ForgotPasswordCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");
    }
}

public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, Unit>
{
    private readonly IApplicationDbContext _context;
    private readonly IEmailService _emailService;

    public ForgotPasswordCommandHandler(
        IApplicationDbContext context,
        IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    public async Task<Unit> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);

        // Never leak user existence — always return success
        if (user == null)
            return Unit.Value;

        // Generate token
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var tokenHash = Convert.ToBase64String(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token)));

        user.PasswordResetTokenHash = tokenHash;
        user.PasswordResetTokenExpiresAt = DateTime.UtcNow.AddHours(1);

        await _context.SaveChangesAsync(cancellationToken);

        await _emailService.SendPasswordResetEmailAsync(user.Email, token, cancellationToken);

        return Unit.Value;
    }
}
