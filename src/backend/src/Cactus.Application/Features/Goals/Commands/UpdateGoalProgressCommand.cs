using Cactus.Application.Common.Interfaces;
using Cactus.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Goals.Commands;

public record UpdateGoalProgressCommand(
    Guid GoalId,
    decimal Amount,
    string? Note = null
) : IRequest<Unit>;

public class UpdateGoalProgressCommandValidator : AbstractValidator<UpdateGoalProgressCommand>
{
    public UpdateGoalProgressCommandValidator()
    {
        RuleFor(x => x.GoalId).NotEmpty();
        RuleFor(x => x.Amount).NotEqual(0);
    }
}

public class UpdateGoalProgressCommandHandler : IRequestHandler<UpdateGoalProgressCommand, Unit>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UpdateGoalProgressCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Unit> Handle(UpdateGoalProgressCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        var goal = await _context.Goals
            .Include(g => g.Milestones)
            .FirstOrDefaultAsync(g => g.Id == request.GoalId && g.UserId == userId, cancellationToken)
            ?? throw new InvalidOperationException("Goal not found");

        goal.CurrentAmount += request.Amount;

        // Record progress
        var progress = new GoalProgress
        {
            GoalId = goal.Id,
            Amount = request.Amount,
            RunningTotal = goal.CurrentAmount,
            Note = request.Note,
            RecordedAt = DateTime.UtcNow
        };
        _context.GoalProgress.Add(progress);

        // Check and update milestones
        foreach (var milestone in goal.Milestones.Where(m => !m.IsReached))
        {
            if (goal.CurrentAmount >= milestone.TargetAmount)
            {
                milestone.IsReached = true;
                milestone.ReachedAt = DateTime.UtcNow;
            }
        }

        // Check if goal is completed
        if (goal.CurrentAmount >= goal.TargetAmount && !goal.IsCompleted)
        {
            goal.IsCompleted = true;
            goal.CompletedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
