using Cactus.Application.Features.Onboarding.Commands;
using Cactus.Application.Features.Onboarding.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cactus.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OnboardingController : ControllerBase
{
    private readonly IMediator _mediator;

    public OnboardingController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("status")]
    public async Task<ActionResult<OnboardingStatusResult>> GetStatus()
    {
        var result = await _mediator.Send(new GetOnboardingStatusQuery());
        return Ok(result);
    }

    [HttpPost("response")]
    public async Task<ActionResult> SaveResponse([FromBody] SaveOnboardingResponseRequest request)
    {
        var command = new SaveOnboardingResponseCommand(
            request.StepNumber,
            request.StepName,
            request.Response
        );
        await _mediator.Send(command);
        return Ok();
    }

    [HttpPost("complete")]
    public async Task<ActionResult> Complete()
    {
        await _mediator.Send(new CompleteOnboardingCommand());
        return Ok();
    }
}

public record SaveOnboardingResponseRequest(
    int StepNumber,
    string StepName,
    string Response
);
