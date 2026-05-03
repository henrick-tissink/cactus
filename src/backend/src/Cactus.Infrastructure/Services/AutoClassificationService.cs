using Cactus.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Infrastructure.Services;

public class AutoClassificationService : IAutoClassificationService
{
    private readonly IApplicationDbContext _context;

    public AutoClassificationService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AutoClassificationResult?> ClassifyAsync(
        Guid userId,
        string description,
        string? merchantName,
        CancellationToken cancellationToken = default)
    {
        var rules = await _context.CategorizationRules
            .Where(r => r.UserId == userId && r.IsActive && r.ConfidenceScore >= 0.7m)
            .OrderByDescending(r => r.ConfidenceScore)
            .ThenByDescending(r => r.MatchCount)
            .ToListAsync(cancellationToken);

        var normalizedDescription = description.ToLowerInvariant().Trim();
        var normalizedMerchant = merchantName?.ToLowerInvariant().Trim();

        foreach (var rule in rules)
        {
            var descriptionMatch = !string.IsNullOrEmpty(rule.Pattern) &&
                normalizedDescription.Contains(rule.Pattern.ToLowerInvariant());

            var merchantMatch = !string.IsNullOrEmpty(rule.MerchantPattern) &&
                !string.IsNullOrEmpty(normalizedMerchant) &&
                normalizedMerchant.Contains(rule.MerchantPattern.ToLowerInvariant());

            if (descriptionMatch || merchantMatch)
            {
                // Boost confidence for dual match
                var confidence = (descriptionMatch && merchantMatch)
                    ? Math.Min(rule.ConfidenceScore + 0.1m, 1.0m)
                    : rule.ConfidenceScore;

                return new AutoClassificationResult(
                    rule.MacroCategoryId,
                    rule.CategoryId,
                    rule.SubCategoryId,
                    confidence
                );
            }
        }

        return null;
    }
}
