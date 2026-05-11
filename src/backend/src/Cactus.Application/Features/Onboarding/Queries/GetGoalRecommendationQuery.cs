using Cactus.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Cactus.Application.Features.Onboarding.Queries;

public record GetGoalRecommendationQuery : IRequest<GoalRecommendationResult>;

public record GoalRecommendationResult(string RecommendedType, string Reason);

public class GetGoalRecommendationQueryHandler
    : IRequestHandler<GetGoalRecommendationQuery, GoalRecommendationResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetGoalRecommendationQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<GoalRecommendationResult> Handle(
        GetGoalRecommendationQuery request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        var responses = await _context.OnboardingResponses
            .Where(r => r.UserId == userId && (r.StepNumber == 7 || r.StepNumber == 8))
            .ToListAsync(cancellationToken);

        var savings = ParseFirstValue(responses.FirstOrDefault(r => r.StepNumber == 8)?.Response);
        var debts = ParseArray(responses.FirstOrDefault(r => r.StepNumber == 7)?.Response);

        var hasNoSavings = savings == "none" || savings == null;
        var hasDebt = debts.Count > 0 && !debts.Contains("none");

        if (hasNoSavings)
        {
            return new GoalRecommendationResult(
                "emergency",
                hasDebt
                    ? "Most people find a small emergency buffer (~R30k) helps before tackling debt — that's where we'd start."
                    : "Building a safety net first protects you from unexpected expenses turning into new debt."
            );
        }

        if (hasDebt)
        {
            return new GoalRecommendationResult(
                "debt",
                "You've got a safety net — now tackling high-interest debt is the highest-leverage move."
            );
        }

        return new GoalRecommendationResult(
            "save",
            "Your foundation is solid. Time to build wealth — let's grow what you've already started."
        );
    }

    private static string? ParseFirstValue(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind == JsonValueKind.Array && doc.RootElement.GetArrayLength() > 0)
                return doc.RootElement[0].GetString();
            return doc.RootElement.ValueKind == JsonValueKind.String ? doc.RootElement.GetString() : null;
        }
        catch
        {
            return null;
        }
    }

    private static List<string> ParseArray(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new();
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind != JsonValueKind.Array) return new();
            var result = new List<string>();
            foreach (var element in doc.RootElement.EnumerateArray())
            {
                var s = element.GetString();
                if (s != null) result.Add(s);
            }
            return result;
        }
        catch
        {
            return new();
        }
    }
}
