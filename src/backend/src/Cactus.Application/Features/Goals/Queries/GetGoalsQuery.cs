using Cactus.Application.Common.Interfaces;
using Cactus.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Goals.Queries;

public record GetGoalsQuery(bool? IsActive = null) : IRequest<List<GoalDto>>;

public record GoalDto(
    Guid Id,
    string Name,
    GoalType GoalType,
    decimal TargetAmount,
    decimal CurrentAmount,
    decimal ProgressPercentage,
    DateTime? TargetDate,
    int Priority,
    bool IsActive,
    bool IsCompleted,
    DateTime? CompletedAt,
    bool IsPrimary,
    Guid? LinkedAccountId,
    string? LinkedAccountName,
    Guid? LinkedDebtId,
    string? LinkedDebtName,
    List<GoalMilestoneDto> Milestones
);

public record GoalMilestoneDto(
    Guid Id,
    string Name,
    decimal TargetAmount,
    bool IsReached,
    DateTime? ReachedAt
);

public class GetGoalsQueryHandler : IRequestHandler<GetGoalsQuery, List<GoalDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetGoalsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<GoalDto>> Handle(GetGoalsQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        var query = _context.Goals
            .Where(g => g.UserId == userId)
            .Include(g => g.LinkedAccount)
            .Include(g => g.LinkedDebt)
            .Include(g => g.Milestones.OrderBy(m => m.TargetAmount))
            .AsQueryable();

        if (request.IsActive.HasValue)
            query = query.Where(g => g.IsActive == request.IsActive.Value);

        var goals = await query
            .OrderByDescending(g => g.IsPrimary)
            .ThenBy(g => g.Priority)
            .ThenBy(g => g.Name)
            .ToListAsync(cancellationToken);

        return goals.Select(g => new GoalDto(
            g.Id,
            g.Name,
            g.GoalType,
            g.TargetAmount,
            g.CurrentAmount,
            g.TargetAmount > 0 ? Math.Min(g.CurrentAmount / g.TargetAmount * 100, 100) : 0,
            g.TargetDate,
            g.Priority,
            g.IsActive,
            g.IsCompleted,
            g.CompletedAt,
            g.IsPrimary,
            g.LinkedAccountId,
            g.LinkedAccount?.Name,
            g.LinkedDebtId,
            g.LinkedDebt?.Name,
            g.Milestones.Select(m => new GoalMilestoneDto(
                m.Id,
                m.Name,
                m.TargetAmount,
                m.IsReached,
                m.ReachedAt
            )).ToList()
        )).ToList();
    }
}
