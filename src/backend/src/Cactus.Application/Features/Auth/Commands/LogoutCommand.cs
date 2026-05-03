using Cactus.Application.Common.Interfaces;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Auth.Commands;

public record LogoutCommand(string RefreshToken) : IRequest<Unit>;

public class LogoutCommandValidator : AbstractValidator<LogoutCommand>
{
    public LogoutCommandValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}

public class LogoutCommandHandler : IRequestHandler<LogoutCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public LogoutCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        var token = await _context.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == request.RefreshToken && !t.IsRevoked, cancellationToken);

        if (token != null)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
            token.RevokedReason = "User logout";
            await _context.SaveChangesAsync(cancellationToken);
        }

        return Unit.Value;
    }
}
