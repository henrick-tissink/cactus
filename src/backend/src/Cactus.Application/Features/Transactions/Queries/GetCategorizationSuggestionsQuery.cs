using Cactus.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Transactions.Queries;

public record GetCategorizationSuggestionsQuery(
    string Description,
    string? MerchantName = null
) : IRequest<List<CategorizationSuggestionDto>>;

public record CategorizationSuggestionDto(
    Guid MacroCategoryId,
    Guid CategoryId,
    Guid? SubCategoryId,
    string MacroCategoryName,
    string CategoryName,
    string? SubCategoryName,
    decimal Confidence,
    string MatchedPattern
);

public class GetCategorizationSuggestionsQueryHandler : IRequestHandler<GetCategorizationSuggestionsQuery, List<CategorizationSuggestionDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetCategorizationSuggestionsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<CategorizationSuggestionDto>> Handle(GetCategorizationSuggestionsQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        var rules = await _context.CategorizationRules
            .Where(r => r.UserId == userId && r.IsActive)
            .Include(r => r.MacroCategory)
            .Include(r => r.Category)
            .Include(r => r.SubCategory)
            .ToListAsync(cancellationToken);

        var suggestions = new List<(CategorizationSuggestionDto Suggestion, decimal Score)>();
        var descriptionLower = request.Description.ToLowerInvariant();
        var merchantLower = request.MerchantName?.ToLowerInvariant();

        foreach (var rule in rules)
        {
            decimal confidence = 0;
            string matchedPattern = rule.Pattern;

            // Exact merchant name match (highest confidence)
            if (!string.IsNullOrEmpty(merchantLower) &&
                !string.IsNullOrEmpty(rule.MerchantPattern) &&
                rule.MerchantPattern.ToLowerInvariant() == merchantLower)
            {
                confidence = Math.Min(rule.ConfidenceScore + 0.3m, 1.0m);
                matchedPattern = $"Merchant: {rule.MerchantPattern}";
            }
            // Exact description match
            else if (rule.Pattern.ToLowerInvariant() == descriptionLower)
            {
                confidence = rule.ConfidenceScore;
                matchedPattern = rule.Pattern;
            }
            // Pattern contains in description or vice versa
            else if (descriptionLower.Contains(rule.Pattern.ToLowerInvariant()) ||
                     rule.Pattern.ToLowerInvariant().Contains(descriptionLower))
            {
                confidence = rule.ConfidenceScore * 0.7m; // Lower confidence for partial match
                matchedPattern = rule.Pattern;
            }
            // Merchant pattern partial match
            else if (!string.IsNullOrEmpty(merchantLower) &&
                     !string.IsNullOrEmpty(rule.MerchantPattern) &&
                     (merchantLower.Contains(rule.MerchantPattern.ToLowerInvariant()) ||
                      rule.MerchantPattern.ToLowerInvariant().Contains(merchantLower)))
            {
                confidence = rule.ConfidenceScore * 0.6m;
                matchedPattern = $"Merchant: {rule.MerchantPattern}";
            }

            if (confidence > 0)
            {
                // Boost confidence based on match count (more uses = more reliable)
                var boostFactor = Math.Min(1.0m + (rule.MatchCount * 0.05m), 1.5m);
                confidence = Math.Min(confidence * boostFactor, 1.0m);

                suggestions.Add((
                    new CategorizationSuggestionDto(
                        rule.MacroCategoryId,
                        rule.CategoryId,
                        rule.SubCategoryId,
                        rule.MacroCategory.Name,
                        rule.Category.Name,
                        rule.SubCategory?.Name,
                        confidence,
                        matchedPattern
                    ),
                    confidence
                ));
            }
        }

        // Order by confidence descending and take top 3
        return suggestions
            .OrderByDescending(s => s.Score)
            .Take(3)
            .Select(s => s.Suggestion)
            .ToList();
    }
}
