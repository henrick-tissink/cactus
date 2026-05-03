using Cactus.Application.Common.Interfaces;
using Cactus.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Accounts.Queries;

public record GetAccountsQuery : IRequest<List<AccountDto>>;

public record AccountDto(
    Guid Id,
    string Name,
    AccountType AccountType,
    decimal Balance,
    string Currency,
    bool IsManual,
    bool IsActive,
    string? BankName,
    DateTime? LastBalanceUpdate
);

public class GetAccountsQueryHandler : IRequestHandler<GetAccountsQuery, List<AccountDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetAccountsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<AccountDto>> Handle(GetAccountsQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        var accounts = await _context.Accounts
            .Where(a => a.UserId == userId && a.IsActive)
            .Include(a => a.BankConnection)
            .OrderBy(a => a.Name)
            .Select(a => new AccountDto(
                a.Id,
                a.Name,
                a.AccountType,
                a.Balance,
                a.Currency,
                a.IsManual,
                a.IsActive,
                a.BankConnection != null ? a.BankConnection.BankName : null,
                a.LastBalanceUpdate
            ))
            .ToListAsync(cancellationToken);

        return accounts;
    }
}
