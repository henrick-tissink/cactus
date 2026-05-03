using Cactus.Application.Features.Accounts.Commands;
using Cactus.Application.Features.Accounts.Queries;
using Cactus.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cactus.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AccountsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AccountsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<List<AccountDto>>> GetAccounts()
    {
        var result = await _mediator.Send(new GetAccountsQuery());
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<Guid>> CreateAccount([FromBody] CreateAccountRequest request)
    {
        var command = new CreateAccountCommand(
            request.Name,
            request.AccountType,
            request.Balance,
            request.Currency
        );
        var id = await _mediator.Send(command);
        return Ok(new { id });
    }
}

public record CreateAccountRequest(
    string Name,
    AccountType AccountType,
    decimal Balance,
    string Currency = "ZAR"
);
