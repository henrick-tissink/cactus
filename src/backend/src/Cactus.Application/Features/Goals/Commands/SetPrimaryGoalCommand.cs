using Cactus.Application.Common.Interfaces;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Goals.Commands;

public record SetPrimaryGoalCommand(Guid GoalId) : IRequest<Unit>;

public class SetPrimaryGoalCommandValidator : AbstractValidator<SetPrimaryGoalCommand>
{
    public SetPrimaryGoalCommandValidator()
    {
        RuleFor(x => x.GoalId).NotEmpty();
    }
}

public class SetPrimaryGoalCommandHandler : IRequestHandler<SetPrimaryGoalCommand, Unit>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public SetPrimaryGoalCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Unit> Handle(SetPrimaryGoalCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        // Get the target goal and verify it belongs to user and is active
        var targetGoal = await _context.Goals
            .FirstOrDefaultAsync(g => g.Id == request.GoalId && g.UserId == userId, cancellationToken)
            ?? throw new InvalidOperationException("Goal not found");

        if (!targetGoal.IsActive)
            throw new InvalidOperationException("Cannot set an inactive goal as primary");

        if (targetGoal.IsCompleted)
            throw new InvalidOperationException("Cannot set a completed goal as primary");

        // Set all user's goals IsPrimary = false
        var userGoals = await _context.Goals
            .Where(g => g.UserId == userId && g.IsPrimary)
            .ToListAsync(cancellationToken);

        foreach (var goal in userGoals)
        {
            goal.IsPrimary = false;
        }

        // Set target goal IsPrimary = true
        targetGoal.IsPrimary = true;

        await _context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
