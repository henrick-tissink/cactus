using Cactus.Domain.Entities;

namespace Cactus.Application.Common.Interfaces;

public record AutoClassificationResult(
    Guid MacroCategoryId,
    Guid CategoryId,
    Guid? SubCategoryId,
    decimal Confidence
);

public interface IAutoClassificationService
{
    Task<AutoClassificationResult?> ClassifyAsync(
        Guid userId,
        string description,
        string? merchantName,
        CancellationToken cancellationToken = default);
}
