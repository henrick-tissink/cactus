using Cactus.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Transactions.Queries;

public record GetRecurringPatternsQuery : IRequest<List<RecurringPatternDetailDto>>;

public record RecurringPatternDetailDto(
    Guid Id,
    string Description,
    decimal AverageAmount,
    int FrequencyDays,
    string FrequencyLabel,
    DateTime? NextExpectedDate,
    string? CategoryName
);

public class GetRecurringPatternsQueryHandler : IRequestHandler<GetRecurringPatternsQuery, List<RecurringPatternDetailDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetRecurringPatternsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<RecurringPatternDetailDto>> Handle(GetRecurringPatternsQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        var userAccounts = await _context.Accounts
            .Where(a => a.UserId == userId && a.IsActive)
            .Select(a => a.Id)
            .ToListAsync(cancellationToken);

        var patterns = await _context.RecurringPatterns
            .Include(p => p.Transaction)
                .ThenInclude(t => t.Category)
            .Where(p => userAccounts.Contains(p.Transaction.AccountId))
            .OrderByDescending(p => p.AverageAmount)
            .ToListAsync(cancellationToken);

        return patterns.Select(p => new RecurringPatternDetailDto(
            p.Id,
            p.PatternDescription,
            p.AverageAmount,
            p.FrequencyDays,
            GetFrequencyLabel(p.FrequencyDays),
            p.NextExpectedDate,
            p.Transaction.Category?.Name
        )).ToList();
    }

    private static string GetFrequencyLabel(int days)
    {
        return days switch
        {
            <= 10 => "Weekly",
            <= 20 => "Bi-weekly",
            <= 35 => "Monthly",
            <= 65 => "Bi-monthly",
            <= 100 => "Quarterly",
            <= 200 => "Semi-annually",
            _ => "Annually"
        };
    }
}
