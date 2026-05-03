using Cactus.Application.Common.Interfaces;
using Cactus.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Transactions.Commands;

public record ClassifyTransactionCommand(
    Guid TransactionId,
    Guid MacroCategoryId,
    Guid CategoryId,
    Guid? SubCategoryId = null,
    string? Notes = null,
    bool ApplyToSimilar = false
) : IRequest<ClassifyTransactionResult>;

public record ClassifyTransactionResult(
    int ClassifiedCount,
    List<Guid> ClassifiedTransactionIds
);

public class ClassifyTransactionCommandValidator : AbstractValidator<ClassifyTransactionCommand>
{
    public ClassifyTransactionCommandValidator()
    {
        RuleFor(x => x.TransactionId).NotEmpty();
        RuleFor(x => x.MacroCategoryId).NotEmpty();
        RuleFor(x => x.CategoryId).NotEmpty();
    }
}

public class ClassifyTransactionCommandHandler : IRequestHandler<ClassifyTransactionCommand, ClassifyTransactionResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public ClassifyTransactionCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ClassifyTransactionResult> Handle(ClassifyTransactionCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        var transaction = await _context.Transactions
            .Include(t => t.Account)
            .FirstOrDefaultAsync(t => t.Id == request.TransactionId, cancellationToken)
            ?? throw new InvalidOperationException("Transaction not found");

        if (transaction.Account.UserId != userId)
            throw new UnauthorizedAccessException();

        var classifiedIds = new List<Guid> { transaction.Id };

        // Classify the main transaction
        ClassifyTransaction(transaction, request);

        // If applyToSimilar is true, find and classify similar unclassified transactions
        if (request.ApplyToSimilar)
        {
            var userAccountIds = await _context.Accounts
                .Where(a => a.UserId == userId && a.IsActive)
                .Select(a => a.Id)
                .ToListAsync(cancellationToken);

            var similarTransactions = await _context.Transactions
                .Where(t => userAccountIds.Contains(t.AccountId) &&
                            !t.IsClassified &&
                            t.Id != transaction.Id &&
                            (t.Description == transaction.Description ||
                             (!string.IsNullOrEmpty(transaction.MerchantName) &&
                              t.MerchantName == transaction.MerchantName)))
                .ToListAsync(cancellationToken);

            foreach (var similar in similarTransactions)
            {
                ClassifyTransaction(similar, request);
                classifiedIds.Add(similar.Id);
            }
        }

        // Create or update categorization rule for future auto-classification
        var existingRule = await _context.CategorizationRules
            .FirstOrDefaultAsync(r => r.UserId == userId && r.Pattern == transaction.Description, cancellationToken);

        if (existingRule != null)
        {
            existingRule.MacroCategoryId = request.MacroCategoryId;
            existingRule.CategoryId = request.CategoryId;
            existingRule.SubCategoryId = request.SubCategoryId;
            existingRule.MatchCount += classifiedIds.Count;
            existingRule.ConfidenceScore = Math.Min(existingRule.ConfidenceScore + (0.1m * classifiedIds.Count), 1.0m);
        }
        else
        {
            var rule = new CategorizationRule
            {
                UserId = userId,
                MacroCategoryId = request.MacroCategoryId,
                CategoryId = request.CategoryId,
                SubCategoryId = request.SubCategoryId,
                Pattern = transaction.Description,
                MerchantPattern = transaction.MerchantName,
                MatchCount = classifiedIds.Count,
                ConfidenceScore = 0.5m,
                IsActive = true
            };
            _context.CategorizationRules.Add(rule);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return new ClassifyTransactionResult(classifiedIds.Count, classifiedIds);
    }

    private static void ClassifyTransaction(Transaction transaction, ClassifyTransactionCommand request)
    {
        transaction.MacroCategoryId = request.MacroCategoryId;
        transaction.CategoryId = request.CategoryId;
        transaction.SubCategoryId = request.SubCategoryId;
        transaction.IsClassified = true;
        // Only set notes on the primary transaction, not on similar ones
    }
}
