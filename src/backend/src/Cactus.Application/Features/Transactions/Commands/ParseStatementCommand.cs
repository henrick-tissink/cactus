using Cactus.Application.Common.Interfaces;
using Cactus.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Transactions.Commands;

public record ParseStatementCommand(
    Stream FileStream,
    string FileName,
    Guid AccountId
) : IRequest<ParseStatementResult>;

public record ParseStatementResult(
    List<ParsedTransactionDto> Transactions,
    int DuplicateCount
);

public record ParsedTransactionDto(
    string TempId,
    DateTime TransactionDate,
    string Description,
    decimal Amount,
    bool IsDebit,
    string? MerchantName,
    bool IsDuplicate,
    Guid? SuggestedMacroCategoryId,
    Guid? SuggestedCategoryId,
    Guid? SuggestedSubCategoryId,
    string? SuggestedCategoryName,
    decimal? SuggestionConfidence
);

public class ParseStatementCommandHandler : IRequestHandler<ParseStatementCommand, ParseStatementResult>
{
    private readonly IStatementParser _parser;
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IAutoClassificationService _autoClassifier;

    public ParseStatementCommandHandler(
        IStatementParser parser,
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IAutoClassificationService autoClassifier)
    {
        _parser = parser;
        _context = context;
        _currentUser = currentUser;
        _autoClassifier = autoClassifier;
    }

    public async Task<ParseStatementResult> Handle(ParseStatementCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        // Verify account
        var account = await _context.Accounts
            .FirstOrDefaultAsync(a => a.Id == request.AccountId && a.UserId == userId, cancellationToken)
            ?? throw new InvalidOperationException("Account not found");

        // Parse file
        var parsed = await _parser.ParseAsync(request.FileStream, request.FileName, cancellationToken);

        if (parsed.Count == 0)
            return new ParseStatementResult(new List<ParsedTransactionDto>(), 0);

        // Get existing transactions for duplicate detection
        var minDate = parsed.Min(p => p.TransactionDate).AddDays(-1);
        var maxDate = parsed.Max(p => p.TransactionDate).AddDays(1);

        var existingTransactions = await _context.Transactions
            .Where(t => t.AccountId == request.AccountId &&
                       t.TransactionDate >= minDate &&
                       t.TransactionDate <= maxDate)
            .ToListAsync(cancellationToken);

        // Pre-load categories for name lookup
        var categories = await _context.Categories.ToDictionaryAsync(c => c.Id, c => c.Name, cancellationToken);

        var results = new List<ParsedTransactionDto>();
        var duplicateCount = 0;

        foreach (var tx in parsed)
        {
            // Check for duplicate
            var isDuplicate = existingTransactions.Any(e =>
                e.TransactionDate.Date == tx.TransactionDate.Date &&
                Math.Abs(e.Amount - tx.Amount) < 0.01m &&
                (e.Description.Contains(tx.Description, StringComparison.OrdinalIgnoreCase) ||
                 tx.Description.Contains(e.Description, StringComparison.OrdinalIgnoreCase)));

            if (isDuplicate) duplicateCount++;

            // Auto-classify
            var classification = await _autoClassifier.ClassifyAsync(
                userId, tx.Description, tx.MerchantName, cancellationToken);

            string? categoryName = null;
            if (classification != null)
            {
                categories.TryGetValue(classification.CategoryId, out categoryName);
            }

            results.Add(new ParsedTransactionDto(
                Guid.NewGuid().ToString(),
                tx.TransactionDate,
                tx.Description,
                tx.Amount,
                tx.IsDebit,
                tx.MerchantName,
                isDuplicate,
                classification?.MacroCategoryId,
                classification?.CategoryId,
                classification?.SubCategoryId,
                categoryName,
                classification?.Confidence
            ));
        }

        return new ParseStatementResult(results, duplicateCount);
    }
}
