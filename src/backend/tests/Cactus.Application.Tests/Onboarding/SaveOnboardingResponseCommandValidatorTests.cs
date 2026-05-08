using Cactus.Application.Features.Onboarding.Commands;
using FluentValidation.TestHelper;
using Xunit;

namespace Cactus.Application.Tests.Onboarding;

public class SaveOnboardingResponseCommandValidatorTests
{
    private readonly SaveOnboardingResponseCommandValidator _validator = new();

    [Theory]
    [InlineData(1)]
    [InlineData(5)]
    [InlineData(9)]
    [InlineData(13)]
    public void StepNumber_WithinAllowedRange_IsValid(int step)
    {
        var cmd = new SaveOnboardingResponseCommand(step, "Test step", "value");
        _validator.TestValidate(cmd).ShouldNotHaveValidationErrorFor(c => c.StepNumber);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(14)]
    [InlineData(-1)]
    [InlineData(100)]
    public void StepNumber_OutsideRange_IsInvalid(int step)
    {
        var cmd = new SaveOnboardingResponseCommand(step, "Test step", "value");
        _validator.TestValidate(cmd).ShouldHaveValidationErrorFor(c => c.StepNumber);
    }
}
