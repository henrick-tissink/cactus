using Cactus.Application.Features.Insights.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cactus.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InsightsController : ControllerBase
{
    private readonly IMediator _mediator;

    public InsightsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get insights data including monthly breakdowns, averages, and trends
    /// </summary>
    /// <returns>Insights data for the last 6 months</returns>
    [HttpGet]
    public async Task<ActionResult<InsightsResult>> GetInsights()
    {
        var result = await _mediator.Send(new GetInsightsQuery());
        return Ok(result);
    }
}
