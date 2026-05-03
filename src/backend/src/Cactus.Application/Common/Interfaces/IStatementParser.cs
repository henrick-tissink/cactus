namespace Cactus.Application.Common.Interfaces;

public record ParsedTransaction(
    DateTime TransactionDate,
    string Description,
    decimal Amount,
    bool IsDebit,
    string? MerchantName = null,
    string? Reference = null
);

public interface IStatementParser
{
    Task<List<ParsedTransaction>> ParseAsync(Stream fileStream, string fileName, CancellationToken cancellationToken = default);
}
