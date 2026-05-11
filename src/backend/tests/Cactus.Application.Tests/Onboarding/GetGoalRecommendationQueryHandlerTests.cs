using Cactus.Application.Common.Interfaces;
using Cactus.Application.Features.Onboarding.Queries;
using Cactus.Application.Tests._Common;
using Cactus.Domain.Entities;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Cactus.Application.Tests.Onboarding;

public class GetGoalRecommendationQueryHandlerTests : HandlerTestBase
{
    private readonly ICurrentUserService _currentUser = Substitute.For<ICurrentUserService>();

    private async Task<User> SeedUserWithResponsesAsync(params (int stepNumber, string response)[] responses)
    {
        var user = TestDataFactory.User();
        Context.Users.Add(user);
        await Context.SaveChangesAsync(default);
        _currentUser.UserId.Returns(user.Id);

        foreach (var (stepNumber, response) in responses)
        {
            Context.OnboardingResponses.Add(new OnboardingResponse
            {
                UserId = user.Id,
                StepNumber = stepNumber,
                StepName = $"Test step {stepNumber}",
                Response = response,
            });
        }
        await Context.SaveChangesAsync(default);
        return user;
    }

    [Fact]
    public async Task NoSavings_NoDebt_RecommendsEmergencyWithSafetyNetReason()
    {
        await SeedUserWithResponsesAsync(
            (8, "[\"none\"]"),
            (7, "[\"none\"]"));

        var handler = new GetGoalRecommendationQueryHandler(Context, _currentUser);
        var result = await handler.Handle(new GetGoalRecommendationQuery(), CancellationToken.None);

        result.RecommendedType.Should().Be("emergency");
        result.Reason.Should().Contain("safety net");
    }

    [Fact]
    public async Task NoSavings_WithDebt_RecommendsEmergencyWithMiniBufferReason()
    {
        await SeedUserWithResponsesAsync(
            (8, "[\"none\"]"),
            (7, "[\"credit_card\"]"));

        var handler = new GetGoalRecommendationQueryHandler(Context, _currentUser);
        var result = await handler.Handle(new GetGoalRecommendationQuery(), CancellationToken.None);

        result.RecommendedType.Should().Be("emergency");
        result.Reason.Should().Contain("buffer");
    }

    [Fact]
    public async Task SomeSavings_WithDebt_RecommendsDebt()
    {
        await SeedUserWithResponsesAsync(
            (8, "[\"under_10k\"]"),
            (7, "[\"credit_card\",\"overdraft\"]"));

        var handler = new GetGoalRecommendationQueryHandler(Context, _currentUser);
        var result = await handler.Handle(new GetGoalRecommendationQuery(), CancellationToken.None);

        result.RecommendedType.Should().Be("debt");
    }

    [Fact]
    public async Task GoodSavings_NoDebt_RecommendsSave()
    {
        await SeedUserWithResponsesAsync(
            (8, "[\"50k_100k\"]"),
            (7, "[\"none\"]"));

        var handler = new GetGoalRecommendationQueryHandler(Context, _currentUser);
        var result = await handler.Handle(new GetGoalRecommendationQuery(), CancellationToken.None);

        result.RecommendedType.Should().Be("save");
    }

    [Fact]
    public async Task NoResponses_RecommendsEmergencyAsDefault()
    {
        await SeedUserWithResponsesAsync(); // no responses at all

        var handler = new GetGoalRecommendationQueryHandler(Context, _currentUser);
        var result = await handler.Handle(new GetGoalRecommendationQuery(), CancellationToken.None);

        result.RecommendedType.Should().Be("emergency");
    }
}
