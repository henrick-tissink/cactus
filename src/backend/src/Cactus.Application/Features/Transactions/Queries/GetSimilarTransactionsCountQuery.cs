using Cactus.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Transactions.Queries;

public record GetSimilarTransactionsCountQuery(
    Guid TransactionId
) : IRequest<SimilarTransactionsCountDto>;

public record SimilarTransactionsCountDto(
    int Count,
    string MatchPattern
);

public class GetSimilarTransactionsCountQueryHandler : IRequestHandler<GetSimilarTransactionsCountQuery, SimilarTransactionsCountDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetSimilarTransactionsCountQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<SimilarTransactionsCountDto> Handle(GetSimilarTransactionsCountQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        var transaction = await _context.Transactions
            .Include(t => t.Account)
            .FirstOrDefaultAsync(t => t.Id == request.TransactionId, cancellationToken)
            ?? throw new InvalidOperationException("Transaction not found");

        if (transaction.Account.UserId != userId)
            throw new UnauthorizedAccessException();

        var userAccountIds = await _context.Accounts
            .Where(a => a.UserId == userId && a.IsActive)
            .Select(a => a.Id)
            .ToListAsync(cancellationToken);

        // Count similar unclassified transactions (excluding the current one)
        var count = await _context.Transactions
            .Where(t => userAccountIds.Contains(t.AccountId) &&
                        !t.IsClassified &&
                        t.Id != transaction.Id &&
                        (t.Description == transaction.Description ||
                         (!string.IsNullOrEmpty(transaction.MerchantName) &&
                          t.MerchantName == transaction.MerchantName)))
            .CountAsync(cancellationToken);

        var matchPattern = !string.IsNullOrEmpty(transaction.MerchantName)
            ? transaction.MerchantName
            : transaction.Description;

        return new SimilarTransactionsCountDto(count, matchPattern);
    }
}
