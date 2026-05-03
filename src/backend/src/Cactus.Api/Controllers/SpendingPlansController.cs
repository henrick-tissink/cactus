using Cactus.Application.Features.SpendingPlans.Commands;
using Cactus.Application.Features.SpendingPlans.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cactus.Api.Controllers;

[ApiController]
[Route("api/spending-plans")]
[Authorize]
public class SpendingPlansController : ControllerBase
{
    private readonly IMediator _mediator;

    public SpendingPlansController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("current")]
    public async Task<ActionResult<SpendingPlanDto>> GetCurrent()
    {
        var result = await _mediator.Send(new GetCurrentSpendingPlanQuery());
        if (result == null)
            return NotFound();
        return Ok(result);
    }

    [HttpPut]
    public async Task<ActionResult<Guid>> UpdatePlan([FromBody] UpdateSpendingPlanRequest request)
    {
        var command = new UpdateSpendingPlanCommand(
            request.MonthlyIncome,
            request.NeedsPercentage,
            request.WantsPercentage,
            request.GoalsPercentage
        );
        var id = await _mediator.Send(command);
        return Ok(new { id });
    }

    [HttpGet("suggestion")]
    public async Task<ActionResult<SpendingPlanSuggestionDto>> GetSuggestion()
    {
        var result = await _mediator.Send(new GetSpendingPlanSuggestionQuery());
        return Ok(result);
    }
}

public record UpdateSpendingPlanRequest(
    decimal MonthlyIncome,
    decimal NeedsPercentage,
    decimal WantsPercentage,
    decimal GoalsPercentage
);
