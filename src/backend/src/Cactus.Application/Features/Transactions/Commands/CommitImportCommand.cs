using Cactus.Application.Common.Interfaces;
using Cactus.Domain.Entities;
using Cactus.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Transactions.Commands;

public record CommitImportCommand(
    Guid AccountId,
    List<ImportTransactionItem> Transactions
) : IRequest<CommitImportResult>;

public record ImportTransactionItem(
    DateTime TransactionDate,
    string Description,
    decimal Amount,
    bool IsDebit,
    string? MerchantName,
    Guid? MacroCategoryId,
    Guid? CategoryId,
    Guid? SubCategoryId
);

public record CommitImportResult(
    int ImportedCount,
    int ClassifiedCount,
    decimal TotalDebits,
    decimal TotalCredits
);

public class CommitImportCommandValidator : AbstractValidator<CommitImportCommand>
{
    public CommitImportCommandValidator()
    {
        RuleFor(x => x.AccountId).NotEmpty();
        RuleFor(x => x.Transactions).NotEmpty().WithMessage("At least one transaction is required");
    }
}

public class CommitImportCommandHandler : IRequestHandler<CommitImportCommand, CommitImportResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IAutoClassificationService _autoClassifier;

    public CommitImportCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IAutoClassificationService autoClassifier)
    {
        _context = context;
        _currentUser = currentUser;
        _autoClassifier = autoClassifier;
    }

    public async Task<CommitImportResult> Handle(CommitImportCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        var account = await _context.Accounts
            .FirstOrDefaultAsync(a => a.Id == request.AccountId && a.UserId == userId, cancellationToken)
            ?? throw new InvalidOperationException("Account not found");

        var importedCount = 0;
        var classifiedCount = 0;
        var totalDebits = 0m;
        var totalCredits = 0m;

        foreach (var item in request.Transactions)
        {
            var macroCategoryId = item.MacroCategoryId;
            var categoryId = item.CategoryId;
            var subCategoryId = item.SubCategoryId;

            // Auto-classify if not already classified
            if (!categoryId.HasValue)
            {
                var classification = await _autoClassifier.ClassifyAsync(
                    userId, item.Description, item.MerchantName, cancellationToken);

                if (classification != null)
                {
                    macroCategoryId = classification.MacroCategoryId;
                    categoryId = classification.CategoryId;
                    subCategoryId = classification.SubCategoryId;
                }
            }

            var isClassified = categoryId.HasValue;
            if (isClassified) classifiedCount++;

            var transaction = new Transaction
            {
                AccountId = request.AccountId,
                Amount = Math.Abs(item.Amount),
                Type = item.IsDebit ? TransactionType.Debit : TransactionType.Credit,
                Description = item.Description,
                MerchantName = item.MerchantName,
                TransactionDate = item.TransactionDate,
                MacroCategoryId = macroCategoryId,
                CategoryId = categoryId,
                SubCategoryId = subCategoryId,
                IsClassified = isClassified,
                IsManual = false
            };

            _context.Transactions.Add(transaction);

            if (item.IsDebit)
            {
                account.Balance -= transaction.Amount;
                totalDebits += transaction.Amount;
            }
            else
            {
                account.Balance += transaction.Amount;
                totalCredits += transaction.Amount;
            }

            importedCount++;
        }

        account.LastBalanceUpdate = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return new CommitImportResult(importedCount, classifiedCount, totalDebits, totalCredits);
    }
}
