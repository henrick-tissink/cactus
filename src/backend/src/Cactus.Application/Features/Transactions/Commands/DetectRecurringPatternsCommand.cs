using Cactus.Application.Common.Interfaces;
using Cactus.Domain.Entities;
using Cactus.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Transactions.Commands;

public record DetectRecurringPatternsCommand : IRequest<Unit>;

public class DetectRecurringPatternsCommandHandler : IRequestHandler<DetectRecurringPatternsCommand, Unit>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public DetectRecurringPatternsCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Unit> Handle(DetectRecurringPatternsCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        var userAccounts = await _context.Accounts
            .Where(a => a.UserId == userId && a.IsActive)
            .Select(a => a.Id)
            .ToListAsync(cancellationToken);

        // Get last 12 months of transactions
        var since = DateTime.UtcNow.AddMonths(-12);
        var transactions = await _context.Transactions
            .Where(t => userAccounts.Contains(t.AccountId) &&
                       t.TransactionDate >= since &&
                       t.Type == TransactionType.Debit)
            .OrderBy(t => t.TransactionDate)
            .ToListAsync(cancellationToken);

        // Remove existing patterns for this user's transactions
        var existingPatterns = await _context.RecurringPatterns
            .Where(p => userAccounts.Contains(p.Transaction.AccountId))
            .ToListAsync(cancellationToken);

        _context.RecurringPatterns.RemoveRange(existingPatterns);

        // Group by normalized description
        var groups = transactions
            .GroupBy(t => NormalizeDescription(t.Description))
            .Where(g => g.Count() >= 3);

        foreach (var group in groups)
        {
            var sorted = group.OrderBy(t => t.TransactionDate).ToList();

            // Calculate intervals between consecutive transactions
            var intervals = new List<double>();
            for (int i = 1; i < sorted.Count; i++)
            {
                intervals.Add((sorted[i].TransactionDate - sorted[i - 1].TransactionDate).TotalDays);
            }

            if (intervals.Count < 2) continue;

            var avgInterval = intervals.Average();
            var stdDev = Math.Sqrt(intervals.Average(v => Math.Pow(v - avgInterval, 2)));

            // Only consider patterns where interval std dev is less than 30% of average
            if (avgInterval <= 0 || stdDev / avgInterval > 0.30) continue;

            var avgAmount = sorted.Average(t => t.Amount);
            var frequencyDays = (int)Math.Round(avgInterval);
            var lastDate = sorted.Last().TransactionDate;
            var nextExpected = lastDate.AddDays(frequencyDays);

            // Create pattern linked to the most recent transaction
            var pattern = new RecurringPattern
            {
                TransactionId = sorted.Last().Id,
                PatternDescription = group.Key,
                AverageAmount = Math.Round(avgAmount, 2),
                FrequencyDays = frequencyDays,
                NextExpectedDate = nextExpected
            };

            _context.RecurringPatterns.Add(pattern);

            // Mark transactions as recurring
            foreach (var tx in sorted)
            {
                tx.IsRecurring = true;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }

    private static string NormalizeDescription(string description)
    {
        // Remove numbers, extra spaces, and normalize case
        var normalized = System.Text.RegularExpressions.Regex.Replace(
            description.ToLowerInvariant(), @"\d+", "").Trim();
        normalized = System.Text.RegularExpressions.Regex.Replace(normalized, @"\s+", " ");
        return normalized;
    }
}
