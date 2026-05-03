using Cactus.Application.Features.Goals.Commands;
using Cactus.Application.Features.Goals.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cactus.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GoalsController : ControllerBase
{
    private readonly IMediator _mediator;

    public GoalsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<List<GoalDto>>> GetGoals([FromQuery] bool? isActive = null)
    {
        var result = await _mediator.Send(new GetGoalsQuery(isActive));
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<Guid>> CreateGoal([FromBody] CreateGoalRequest request)
    {
        var command = new CreateGoalCommand(
            request.Name,
            request.GoalType,
            request.TargetAmount,
            request.TargetDate,
            request.LinkedAccountId,
            request.LinkedDebtId
        );
        var id = await _mediator.Send(command);
        return Ok(new { id });
    }

    [HttpPost("{id}/progress")]
    public async Task<ActionResult> UpdateProgress(Guid id, [FromBody] UpdateProgressRequest request)
    {
        var command = new UpdateGoalProgressCommand(id, request.Amount, request.Note);
        await _mediator.Send(command);
        return Ok();
    }

    [HttpPost("{id}/set-primary")]
    public async Task<ActionResult> SetPrimary(Guid id)
    {
        var command = new SetPrimaryGoalCommand(id);
        await _mediator.Send(command);
        return Ok();
    }

    [HttpGet("recommended-sequence")]
    public async Task<ActionResult<List<GoalRecommendationDto>>> GetRecommendedSequence()
    {
        var result = await _mediator.Send(new GetGoalRecommendationsQuery());
        return Ok(result);
    }
}

public record CreateGoalRequest(
    string Name,
    Domain.Enums.GoalType GoalType,
    decimal TargetAmount,
    DateTime? TargetDate = null,
    Guid? LinkedAccountId = null,
    Guid? LinkedDebtId = null
);

public record UpdateProgressRequest(decimal Amount, string? Note = null);
