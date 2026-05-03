using Cactus.Application.Common.Interfaces;
using Cactus.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Transactions.Commands;

public record TransactionClassification(
    Guid TransactionId,
    Guid MacroCategoryId,
    Guid CategoryId,
    Guid? SubCategoryId = null
);

public record BulkClassifyTransactionsCommand(
    List<TransactionClassification> Classifications
) : IRequest<BulkClassifyTransactionsResult>;

public record BulkClassifyTransactionsResult(
    int SuccessCount,
    int FailedCount,
    List<string> Errors
);

public class BulkClassifyTransactionsCommandValidator : AbstractValidator<BulkClassifyTransactionsCommand>
{
    public BulkClassifyTransactionsCommandValidator()
    {
        RuleFor(x => x.Classifications).NotEmpty().WithMessage("At least one classification is required");
        RuleForEach(x => x.Classifications).ChildRules(classification =>
        {
            classification.RuleFor(c => c.TransactionId).NotEmpty();
            classification.RuleFor(c => c.MacroCategoryId).NotEmpty();
            classification.RuleFor(c => c.CategoryId).NotEmpty();
        });
    }
}

public class BulkClassifyTransactionsCommandHandler : IRequestHandler<BulkClassifyTransactionsCommand, BulkClassifyTransactionsResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public BulkClassifyTransactionsCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<BulkClassifyTransactionsResult> Handle(BulkClassifyTransactionsCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var errors = new List<string>();
        var successCount = 0;

        // Get all transaction IDs from the request
        var transactionIds = request.Classifications.Select(c => c.TransactionId).ToList();

        // Fetch all transactions in a single query
        var transactions = await _context.Transactions
            .Include(t => t.Account)
            .Where(t => transactionIds.Contains(t.Id))
            .ToListAsync(cancellationToken);

        // Create a lookup for quick access
        var transactionLookup = transactions.ToDictionary(t => t.Id);

        // Validate all transactions belong to the current user
        var unauthorizedTransactions = transactions
            .Where(t => t.Account.UserId != userId)
            .Select(t => t.Id)
            .ToHashSet();

        if (unauthorizedTransactions.Count != 0)
        {
            errors.Add($"Unauthorized access to {unauthorizedTransactions.Count} transaction(s)");
        }

        // Fetch existing categorization rules for this user
        var existingRules = await _context.CategorizationRules
            .Where(r => r.UserId == userId)
            .ToListAsync(cancellationToken);
        var ruleLookup = existingRules.ToDictionary(r => r.Pattern);

        // Track patterns we've already processed in this bulk operation
        var processedPatterns = new HashSet<string>();
        var newRules = new List<CategorizationRule>();

        // Process each classification
        foreach (var classification in request.Classifications)
        {
            if (!transactionLookup.TryGetValue(classification.TransactionId, out var transaction))
            {
                errors.Add($"Transaction {classification.TransactionId} not found");
                continue;
            }

            if (unauthorizedTransactions.Contains(classification.TransactionId))
            {
                continue; // Already reported
            }

            // Update the transaction
            transaction.MacroCategoryId = classification.MacroCategoryId;
            transaction.CategoryId = classification.CategoryId;
            transaction.SubCategoryId = classification.SubCategoryId;
            transaction.IsClassified = true;

            successCount++;

            // Handle categorization rules - only process unique patterns once
            if (!string.IsNullOrEmpty(transaction.Description) && !processedPatterns.Contains(transaction.Description))
            {
                processedPatterns.Add(transaction.Description);

                if (ruleLookup.TryGetValue(transaction.Description, out var existingRule))
                {
                    existingRule.MacroCategoryId = classification.MacroCategoryId;
                    existingRule.CategoryId = classification.CategoryId;
                    existingRule.SubCategoryId = classification.SubCategoryId;
                    existingRule.MatchCount++;
                    existingRule.ConfidenceScore = Math.Min(existingRule.ConfidenceScore + 0.1m, 1.0m);
                }
                else
                {
                    var newRule = new CategorizationRule
                    {
                        UserId = userId,
                        MacroCategoryId = classification.MacroCategoryId,
                        CategoryId = classification.CategoryId,
                        SubCategoryId = classification.SubCategoryId,
                        Pattern = transaction.Description,
                        MerchantPattern = transaction.MerchantName,
                        MatchCount = 1,
                        ConfidenceScore = 0.5m,
                        IsActive = true
                    };
                    newRules.Add(newRule);
                    ruleLookup[transaction.Description] = newRule; // Add to lookup in case of duplicates
                }
            }
        }

        // Add all new rules in bulk
        if (newRules.Count > 0)
        {
            _context.CategorizationRules.AddRange(newRules);
        }

        // Save all changes in a single operation
        await _context.SaveChangesAsync(cancellationToken);

        return new BulkClassifyTransactionsResult(
            successCount,
            request.Classifications.Count - successCount,
            errors
        );
    }
}
