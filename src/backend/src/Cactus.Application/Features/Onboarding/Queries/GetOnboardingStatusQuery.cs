using Cactus.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Onboarding.Queries;

public record GetOnboardingStatusQuery : IRequest<OnboardingStatusResult>;

public record OnboardingStatusResult(
    bool IsComplete,
    int CurrentStep,
    List<OnboardingResponseDto> Responses
);

public record OnboardingResponseDto(
    int StepNumber,
    string StepName,
    string Response
);

public class GetOnboardingStatusQueryHandler : IRequestHandler<GetOnboardingStatusQuery, OnboardingStatusResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetOnboardingStatusQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<OnboardingStatusResult> Handle(GetOnboardingStatusQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        var user = await _context.Users.FindAsync([userId], cancellationToken)
            ?? throw new InvalidOperationException("User not found");

        var responses = await _context.OnboardingResponses
            .Where(o => o.UserId == userId)
            .OrderBy(o => o.StepNumber)
            .Select(o => new OnboardingResponseDto(o.StepNumber, o.StepName, o.Response))
            .ToListAsync(cancellationToken);

        var currentStep = responses.Count > 0 ? responses.Max(r => r.StepNumber) + 1 : 1;
        currentStep = Math.Min(currentStep, 8);

        return new OnboardingStatusResult(
            user.IsOnboardingComplete,
            currentStep,
            responses
        );
    }
}
