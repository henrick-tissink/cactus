using Cactus.Application.Common.Interfaces;
using Cactus.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Onboarding.Commands;

public record SaveOnboardingResponseCommand(
    int StepNumber,
    string StepName,
    string Response
) : IRequest<Unit>;

public class SaveOnboardingResponseCommandValidator : AbstractValidator<SaveOnboardingResponseCommand>
{
    public SaveOnboardingResponseCommandValidator()
    {
        RuleFor(x => x.StepNumber).InclusiveBetween(1, 13);
        RuleFor(x => x.StepName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Response).NotEmpty();
    }
}

public class SaveOnboardingResponseCommandHandler : IRequestHandler<SaveOnboardingResponseCommand, Unit>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public SaveOnboardingResponseCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Unit> Handle(SaveOnboardingResponseCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        var existing = await _context.OnboardingResponses
            .FirstOrDefaultAsync(o => o.UserId == userId && o.StepNumber == request.StepNumber, cancellationToken);

        if (existing != null)
        {
            existing.StepName = request.StepName;
            existing.Response = request.Response;
        }
        else
        {
            var response = new OnboardingResponse
            {
                UserId = userId,
                StepNumber = request.StepNumber,
                StepName = request.StepName,
                Response = request.Response
            };
            _context.OnboardingResponses.Add(response);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
