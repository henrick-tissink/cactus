using Cactus.Application.Common.Interfaces;
using Cactus.Application.Features.Onboarding.Commands;
using Cactus.Application.Tests._Common;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Cactus.Application.Tests.Onboarding;

public class SaveOnboardingResponseCommandHandlerTests : HandlerTestBase
{
    private readonly ICurrentUserService _currentUser = Substitute.For<ICurrentUserService>();

    [Fact]
    public async Task SaveOnboardingResponse_persists_new_response_for_user()
    {
        // Arrange
        var user = TestDataFactory.User();
        Context.Users.Add(user);
        await Context.SaveChangesAsync(default);

        _currentUser.UserId.Returns(user.Id);

        var handler = new SaveOnboardingResponseCommandHandler(Context, _currentUser);
        var command = new SaveOnboardingResponseCommand(
            StepNumber: 1,
            StepName:   "Welcome",
            Response:   "accepted"
        );

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        var saved = Context.OnboardingResponses.FirstOrDefault(o => o.UserId == user.Id && o.StepNumber == 1);
        saved.Should().NotBeNull();
        saved!.StepName.Should().Be("Welcome");
        saved.Response.Should().Be("accepted");
    }

    [Fact]
    public async Task SaveOnboardingResponse_updates_existing_response_for_same_step()
    {
        // Arrange
        var user = TestDataFactory.User();
        Context.Users.Add(user);
        await Context.SaveChangesAsync(default);

        _currentUser.UserId.Returns(user.Id);

        var handler = new SaveOnboardingResponseCommandHandler(Context, _currentUser);

        // First save
        await handler.Handle(new SaveOnboardingResponseCommand(2, "Goals", "initial"), CancellationToken.None);

        // Act: update the same step
        await handler.Handle(new SaveOnboardingResponseCommand(2, "Goals", "updated"), CancellationToken.None);

        // Assert: only one record exists with the updated response
        var responses = Context.OnboardingResponses.Where(o => o.UserId == user.Id && o.StepNumber == 2).ToList();
        responses.Should().ContainSingle();
        responses[0].Response.Should().Be("updated");
    }
}
