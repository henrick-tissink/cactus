using Cactus.Application.Common.Interfaces;
using Cactus.Domain.Entities;
using Cactus.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Goals.Commands;

public record CreateGoalCommand(
    string Name,
    GoalType GoalType,
    decimal TargetAmount,
    DateTime? TargetDate = null,
    Guid? LinkedAccountId = null,
    Guid? LinkedDebtId = null
) : IRequest<Guid>;

public class CreateGoalCommandValidator : AbstractValidator<CreateGoalCommand>
{
    public CreateGoalCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.TargetAmount).GreaterThan(0);
    }
}

public class CreateGoalCommandHandler : IRequestHandler<CreateGoalCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public CreateGoalCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(CreateGoalCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        // Get next priority and check if this is the user's first active goal
        var activeGoalsCount = await _context.Goals
            .Where(g => g.UserId == userId && g.IsActive && !g.IsCompleted)
            .CountAsync(cancellationToken);

        var maxPriority = await _context.Goals
            .Where(g => g.UserId == userId && g.IsActive)
            .MaxAsync(g => (int?)g.Priority, cancellationToken) ?? 0;

        // If this is the user's first active goal, it should be primary
        var isPrimary = activeGoalsCount == 0;

        decimal currentAmount = 0;

        // If linked to account, use account balance as starting amount
        if (request.LinkedAccountId.HasValue)
        {
            var account = await _context.Accounts
                .FirstOrDefaultAsync(a => a.Id == request.LinkedAccountId && a.UserId == userId, cancellationToken);
            if (account != null)
                currentAmount = account.Balance;
        }

        // If linked to debt, calculate remaining amount
        if (request.LinkedDebtId.HasValue)
        {
            var debt = await _context.UserDebts
                .FirstOrDefaultAsync(d => d.Id == request.LinkedDebtId && d.UserId == userId, cancellationToken);
            if (debt != null)
                currentAmount = debt.OriginalAmount - debt.CurrentBalance; // Amount paid off
        }

        var goal = new Goal
        {
            UserId = userId,
            Name = request.Name,
            GoalType = request.GoalType,
            TargetAmount = request.TargetAmount,
            CurrentAmount = currentAmount,
            TargetDate = request.TargetDate,
            LinkedAccountId = request.LinkedAccountId,
            LinkedDebtId = request.LinkedDebtId,
            Priority = maxPriority + 1,
            IsActive = true,
            IsCompleted = false,
            IsPrimary = isPrimary
        };

        _context.Goals.Add(goal);

        // Create default milestones
        var milestones = new List<GoalMilestone>
        {
            new() { GoalId = goal.Id, Name = "25% Complete", TargetAmount = request.TargetAmount * 0.25m },
            new() { GoalId = goal.Id, Name = "50% Complete", TargetAmount = request.TargetAmount * 0.50m },
            new() { GoalId = goal.Id, Name = "75% Complete", TargetAmount = request.TargetAmount * 0.75m },
            new() { GoalId = goal.Id, Name = "Goal Reached!", TargetAmount = request.TargetAmount }
        };

        _context.GoalMilestones.AddRange(milestones);

        await _context.SaveChangesAsync(cancellationToken);
        return goal.Id;
    }
}
