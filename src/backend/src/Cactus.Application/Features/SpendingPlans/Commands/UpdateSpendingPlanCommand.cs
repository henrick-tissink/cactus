using Cactus.Application.Common.Interfaces;
using Cactus.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.SpendingPlans.Commands;

public record UpdateSpendingPlanCommand(
    decimal MonthlyIncome,
    decimal NeedsPercentage,
    decimal WantsPercentage,
    decimal GoalsPercentage
) : IRequest<Guid>;

public class UpdateSpendingPlanCommandValidator : AbstractValidator<UpdateSpendingPlanCommand>
{
    public UpdateSpendingPlanCommandValidator()
    {
        RuleFor(x => x.MonthlyIncome).GreaterThanOrEqualTo(0);
        RuleFor(x => x.NeedsPercentage).InclusiveBetween(0, 100);
        RuleFor(x => x.WantsPercentage).InclusiveBetween(0, 100);
        RuleFor(x => x.GoalsPercentage).InclusiveBetween(0, 100);
        RuleFor(x => x)
            .Must(x => x.NeedsPercentage + x.WantsPercentage + x.GoalsPercentage == 100)
            .WithMessage("Percentages must sum to 100");
    }
}

public class UpdateSpendingPlanCommandHandler : IRequestHandler<UpdateSpendingPlanCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UpdateSpendingPlanCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(UpdateSpendingPlanCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var now = DateTime.UtcNow;

        var plan = await _context.SpendingPlans
            .FirstOrDefaultAsync(p => p.UserId == userId && p.Year == now.Year && p.Month == now.Month, cancellationToken);

        if (plan == null)
        {
            plan = new SpendingPlan
            {
                UserId = userId,
                Year = now.Year,
                Month = now.Month,
                MonthlyIncome = request.MonthlyIncome,
                NeedsPercentage = request.NeedsPercentage,
                WantsPercentage = request.WantsPercentage,
                GoalsPercentage = request.GoalsPercentage,
                IsActive = true
            };
            _context.SpendingPlans.Add(plan);
        }
        else
        {
            plan.MonthlyIncome = request.MonthlyIncome;
            plan.NeedsPercentage = request.NeedsPercentage;
            plan.WantsPercentage = request.WantsPercentage;
            plan.GoalsPercentage = request.GoalsPercentage;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return plan.Id;
    }
}
