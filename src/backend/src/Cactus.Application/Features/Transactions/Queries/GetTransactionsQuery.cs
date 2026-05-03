using Cactus.Application.Common.Interfaces;
using Cactus.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Transactions.Queries;

public record GetTransactionsQuery(
    int Page = 1,
    int PageSize = 20,
    Guid? AccountId = null,
    Guid? CategoryId = null,
    bool? IsClassified = null,
    DateTime? StartDate = null,
    DateTime? EndDate = null
) : IRequest<TransactionsResult>;

public record TransactionsResult(
    List<TransactionDto> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
);

public record TransactionDto(
    Guid Id,
    Guid AccountId,
    string AccountName,
    Guid? MacroCategoryId,
    string? MacroCategoryName,
    Guid? CategoryId,
    string? CategoryName,
    Guid? SubCategoryId,
    string? SubCategoryName,
    decimal Amount,
    TransactionType Type,
    string Description,
    string? MerchantName,
    DateTime TransactionDate,
    bool IsClassified,
    bool IsManual,
    string? Notes
);

public class GetTransactionsQueryHandler : IRequestHandler<GetTransactionsQuery, TransactionsResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetTransactionsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<TransactionsResult> Handle(GetTransactionsQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        var userAccounts = await _context.Accounts
            .Where(a => a.UserId == userId && a.IsActive)
            .Select(a => a.Id)
            .ToListAsync(cancellationToken);

        var query = _context.Transactions
            .Where(t => userAccounts.Contains(t.AccountId))
            .Include(t => t.Account)
            .Include(t => t.MacroCategory)
            .Include(t => t.Category)
            .Include(t => t.SubCategory)
            .AsQueryable();

        if (request.AccountId.HasValue)
            query = query.Where(t => t.AccountId == request.AccountId.Value);

        if (request.CategoryId.HasValue)
            query = query.Where(t => t.CategoryId == request.CategoryId.Value);

        if (request.IsClassified.HasValue)
            query = query.Where(t => t.IsClassified == request.IsClassified.Value);

        if (request.StartDate.HasValue)
            query = query.Where(t => t.TransactionDate >= request.StartDate.Value);

        if (request.EndDate.HasValue)
            query = query.Where(t => t.TransactionDate <= request.EndDate.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(t => t.TransactionDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(t => new TransactionDto(
                t.Id,
                t.AccountId,
                t.Account.Name,
                t.MacroCategoryId,
                t.MacroCategory != null ? t.MacroCategory.Name : null,
                t.CategoryId,
                t.Category != null ? t.Category.Name : null,
                t.SubCategoryId,
                t.SubCategory != null ? t.SubCategory.Name : null,
                t.Amount,
                t.Type,
                t.Description,
                t.MerchantName,
                t.TransactionDate,
                t.IsClassified,
                t.IsManual,
                t.Notes
            ))
            .ToListAsync(cancellationToken);

        return new TransactionsResult(
            items,
            totalCount,
            request.Page,
            request.PageSize,
            (int)Math.Ceiling((double)totalCount / request.PageSize)
        );
    }
}
