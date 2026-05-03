using Cactus.Application.Common.Interfaces;
using Cactus.Domain.Entities;
using Cactus.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Transactions.Commands;

public record CreateTransactionCommand(
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
) : IRequest<Guid>;

public class CreateTransactionCommandValidator : AbstractValidator<CreateTransactionCommand>
{
    public CreateTransactionCommandValidator()
    {
        RuleFor(x => x.AccountId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(500);
        RuleFor(x => x.MerchantName).MaximumLength(200);
    }
}

public class CreateTransactionCommandHandler : IRequestHandler<CreateTransactionCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IAutoClassificationService _autoClassifier;

    public CreateTransactionCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IAutoClassificationService autoClassifier)
    {
        _context = context;
        _currentUser = currentUser;
        _autoClassifier = autoClassifier;
    }

    public async Task<Guid> Handle(CreateTransactionCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        // Verify account belongs to user
        var account = await _context.Accounts
            .FirstOrDefaultAsync(a => a.Id == request.AccountId && a.UserId == userId, cancellationToken)
            ?? throw new InvalidOperationException("Account not found");

        var macroCategoryId = request.MacroCategoryId;
        var categoryId = request.CategoryId;
        var subCategoryId = request.SubCategoryId;

        // Auto-classify if not already classified
        if (!categoryId.HasValue)
        {
            var classification = await _autoClassifier.ClassifyAsync(
                userId, request.Description, request.MerchantName, cancellationToken);

            if (classification != null)
            {
                macroCategoryId = classification.MacroCategoryId;
                categoryId = classification.CategoryId;
                subCategoryId = classification.SubCategoryId;
            }
        }

        var transaction = new Transaction
        {
            AccountId = request.AccountId,
            Amount = Math.Abs(request.Amount),
            Type = request.Type,
            Description = request.Description,
            MerchantName = request.MerchantName,
            TransactionDate = request.TransactionDate,
            MacroCategoryId = macroCategoryId,
            CategoryId = categoryId,
            SubCategoryId = subCategoryId,
            IsClassified = categoryId.HasValue,
            IsManual = true,
            Notes = request.Notes
        };

        _context.Transactions.Add(transaction);

        // Update account balance
        if (request.Type == TransactionType.Debit)
            account.Balance -= transaction.Amount;
        else
            account.Balance += transaction.Amount;

        account.LastBalanceUpdate = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return transaction.Id;
    }
}
