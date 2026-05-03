using Cactus.Application.Features.Transactions.Commands;
using Cactus.Application.Features.Transactions.Queries;
using Cactus.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cactus.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly IMediator _mediator;

    public TransactionsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<TransactionsResult>> GetTransactions(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] Guid? accountId = null,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] bool? isClassified = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var query = new GetTransactionsQuery(page, pageSize, accountId, categoryId, isClassified, startDate, endDate);
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<Guid>> CreateTransaction([FromBody] CreateTransactionRequest request)
    {
        var command = new CreateTransactionCommand(
            request.AccountId,
            request.Amount,
            request.Type,
            request.Description,
            request.TransactionDate,
            request.MacroCategoryId,
            request.CategoryId,
            request.SubCategoryId,
            request.MerchantName,
            request.Notes
        );
        var id = await _mediator.Send(command);
        return Ok(new { id });
    }

    [HttpPost("{id}/classify")]
    public async Task<ActionResult<ClassifyTransactionResult>> ClassifyTransaction(Guid id, [FromBody] ClassifyTransactionRequest request)
    {
        var command = new ClassifyTransactionCommand(
            id,
            request.MacroCategoryId,
            request.CategoryId,
            request.SubCategoryId,
            request.Notes,
            request.ApplyToSimilar
        );
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpGet("unclassified")]
    public async Task<ActionResult<TransactionsResult>> GetUnclassified(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = new GetTransactionsQuery(page, pageSize, IsClassified: false);
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpPost("bulk-classify")]
    public async Task<ActionResult<BulkClassifyTransactionsResult>> BulkClassifyTransactions(
        [FromBody] BulkClassifyTransactionsRequest request)
    {
        var classifications = request.Classifications
            .Select(c => new TransactionClassification(
                c.TransactionId,
                c.MacroCategoryId,
                c.CategoryId,
                c.SubCategoryId
            ))
            .ToList();

        var command = new BulkClassifyTransactionsCommand(classifications);
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpGet("suggestions")]
    public async Task<ActionResult<List<CategorizationSuggestionDto>>> GetSuggestions(
        [FromQuery] string description,
        [FromQuery] string? merchant = null)
    {
        var query = new GetCategorizationSuggestionsQuery(description, merchant);
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("{id}/similar-count")]
    public async Task<ActionResult<SimilarTransactionsCountDto>> GetSimilarCount(Guid id)
    {
        var query = new GetSimilarTransactionsCountQuery(id);
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpPost("import/parse")]
    public async Task<ActionResult<ParseStatementResult>> ParseStatement(
        IFormFile file,
        [FromQuery] Guid accountId)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded" });

        using var stream = file.OpenReadStream();
        var command = new ParseStatementCommand(stream, file.FileName, accountId);
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPost("import/commit")]
    public async Task<ActionResult<CommitImportResult>> CommitImport([FromBody] CommitImportRequest request)
    {
        var transactions = request.Transactions
            .Select(t => new ImportTransactionItem(
                t.TransactionDate,
                t.Description,
                t.Amount,
                t.IsDebit,
                t.MerchantName,
                t.MacroCategoryId,
                t.CategoryId,
                t.SubCategoryId
            ))
            .ToList();

        var command = new CommitImportCommand(request.AccountId, transactions);
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPost("recurring/detect")]
    public async Task<ActionResult> DetectRecurringPatterns()
    {
        await _mediator.Send(new DetectRecurringPatternsCommand());
        return Ok(new { message = "Recurring patterns detected successfully" });
    }

    [HttpGet("recurring")]
    public async Task<ActionResult<List<RecurringPatternDetailDto>>> GetRecurringPatterns()
    {
        var result = await _mediator.Send(new GetRecurringPatternsQuery());
        return Ok(result);
    }
}

public record CreateTransactionRequest(
    Guid AccountId,
    decimal Amount,
    TransactionType Type,
    string Description,
    DateTime TransactionDate,
    Guid? MacroCategoryId = null,
    Guid? CategoryId = null,
    Guid? SubCategoryId = null,
    string? MerchantName = null,
    string? Notes = null
);

public record ClassifyTransactionRequest(
    Guid MacroCategoryId,
    Guid CategoryId,
    Guid? SubCategoryId = null,
    string? Notes = null,
    bool ApplyToSimilar = false
);

public record BulkClassifyTransactionsRequest(
    List<BulkTransactionClassificationItem> Classifications
);

public record BulkTransactionClassificationItem(
    Guid TransactionId,
    Guid MacroCategoryId,
    Guid CategoryId,
    Guid? SubCategoryId = null
);

public record CommitImportRequest(
    Guid AccountId,
    List<CommitImportTransactionItem> Transactions
);

public record CommitImportTransactionItem(
    DateTime TransactionDate,
    string Description,
    decimal Amount,
    bool IsDebit,
    string? MerchantName = null,
    Guid? MacroCategoryId = null,
    Guid? CategoryId = null,
    Guid? SubCategoryId = null
);
