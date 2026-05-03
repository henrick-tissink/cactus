using Cactus.Application.Common.Interfaces;
using Cactus.Domain.Entities;
using Cactus.Domain.Enums;
using FluentValidation;
using MediatR;

namespace Cactus.Application.Features.Accounts.Commands;

public record CreateAccountCommand(
    string Name,
    AccountType AccountType,
    decimal Balance,
    string Currency = "ZAR"
) : IRequest<Guid>;

public class CreateAccountCommandValidator : AbstractValidator<CreateAccountCommand>
{
    public CreateAccountCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Currency).NotEmpty().Length(3);
    }
}

public class CreateAccountCommandHandler : IRequestHandler<CreateAccountCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public CreateAccountCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(CreateAccountCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        var account = new Account
        {
            UserId = userId,
            Name = request.Name,
            AccountType = request.AccountType,
            Balance = request.Balance,
            Currency = request.Currency,
            IsManual = true,
            IsActive = true,
            LastBalanceUpdate = DateTime.UtcNow
        };

        _context.Accounts.Add(account);
        await _context.SaveChangesAsync(cancellationToken);

        return account.Id;
    }
}
