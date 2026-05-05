using Cactus.Application.Common.Interfaces;
using Cactus.Application.Features.Onboarding.Queries;
using Cactus.Application.Tests._Common;
using Cactus.Domain.Entities;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Cactus.Application.Tests.Onboarding;

public class GetOnboardingStatusQueryHandlerTests : HandlerTestBase
{
    private readonly ICurrentUserService _currentUser = Substitute.For<ICurrentUserService>();

    [Fact]
    public async Task GetOnboardingStatus_returns_correct_step_and_responses_for_user()
    {
        // Arrange
        var user = TestDataFactory.User();
        Context.Users.Add(user);
        await Context.SaveChangesAsync(default);

        var response1 = new OnboardingResponse
        {
            UserId = user.Id,
            StepNumber = 1,
            StepName = "Welcome",
            Response = "accepted",
        };
        var response2 = new OnboardingResponse
        {
            UserId = user.Id,
            StepNumber = 2,
            StepName = "Goals",
            Response = "save_emergency_fund",
        };
        Context.OnboardingResponses.AddRange(response1, response2);
        await Context.SaveChangesAsync(default);

        _currentUser.UserId.Returns(user.Id);

        var handler = new GetOnboardingStatusQueryHandler(Context, _currentUser);

        // Act
        var result = await handler.Handle(new GetOnboardingStatusQuery(), CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsComplete.Should().BeFalse(); // user.IsOnboardingComplete is false from factory
        result.CurrentStep.Should().Be(3);    // max step was 2, so next step is 3
        result.Responses.Should().HaveCount(2);
        result.Responses[0].StepNumber.Should().Be(1);
        result.Responses[1].StepNumber.Should().Be(2);
    }
}
