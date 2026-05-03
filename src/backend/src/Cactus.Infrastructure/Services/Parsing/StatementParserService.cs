using Cactus.Application.Common.Interfaces;

namespace Cactus.Infrastructure.Services.Parsing;

public class StatementParserService : IStatementParser
{
    private readonly CsvStatementParser _csvParser = new();
    private readonly OfxStatementParser _ofxParser = new();

    public async Task<List<ParsedTransaction>> ParseAsync(Stream fileStream, string fileName, CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();

        return extension switch
        {
            ".csv" => await _csvParser.ParseAsync(fileStream, cancellationToken),
            ".ofx" or ".qfx" => await _ofxParser.ParseAsync(fileStream, cancellationToken),
            _ => throw new InvalidOperationException($"Unsupported file format: {extension}. Supported formats: .csv, .ofx, .qfx")
        };
    }
}
