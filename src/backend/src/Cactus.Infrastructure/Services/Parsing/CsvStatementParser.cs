using System.Globalization;
using Cactus.Application.Common.Interfaces;
using CsvHelper;
using CsvHelper.Configuration;

namespace Cactus.Infrastructure.Services.Parsing;

public class CsvStatementParser
{
    // Bank-specific column presets
    private static readonly Dictionary<string, BankPreset> BankPresets = new()
    {
        ["fnb"] = new BankPreset("Date", "Description", "Amount", null, "dd/MM/yyyy"),
        ["nedbank"] = new BankPreset("Date", "Description", "Amount", null, "yyyy-MM-dd"),
        ["capitec"] = new BankPreset("Date", "Description", "Debit", "Credit", "yyyy/MM/dd"),
        ["standard"] = new BankPreset("Date", "Description", "Amount", null, "dd MMM yyyy"),
        ["absa"] = new BankPreset("Date", "Description", "Amount", null, "yyyyMMdd"),
    };

    public async Task<List<ParsedTransaction>> ParseAsync(Stream stream, CancellationToken cancellationToken)
    {
        using var reader = new StreamReader(stream);
        var content = await reader.ReadToEndAsync(cancellationToken);

        // Try to detect bank from content
        var preset = DetectBank(content);

        // Parse with detected or generic settings
        var transactions = new List<ParsedTransaction>();
        using var stringReader = new StringReader(content);
        using var csv = new CsvReader(stringReader, new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true,
            MissingFieldFound = null,
            HeaderValidated = null,
            BadDataFound = null,
        });

        await csv.ReadAsync();
        csv.ReadHeader();
        var headers = csv.HeaderRecord ?? Array.Empty<string>();

        // Find column indices
        var dateCol = FindColumn(headers, preset?.DateColumn, "date", "transaction date", "trans date");
        var descCol = FindColumn(headers, preset?.DescriptionColumn, "description", "desc", "narrative", "details");
        var amountCol = FindColumn(headers, preset?.AmountColumn, "amount", "value");
        var debitCol = FindColumn(headers, preset?.DebitColumn, "debit", "debit amount");
        var creditCol = FindColumn(headers, null, "credit", "credit amount");

        if (dateCol < 0 || descCol < 0 || (amountCol < 0 && debitCol < 0))
        {
            throw new InvalidOperationException(
                "Could not identify required columns (Date, Description, Amount). Please check the CSV format.");
        }

        while (await csv.ReadAsync())
        {
            try
            {
                var dateStr = csv.GetField(dateCol)?.Trim();
                var description = csv.GetField(descCol)?.Trim() ?? "";

                if (string.IsNullOrWhiteSpace(dateStr) || string.IsNullOrWhiteSpace(description))
                    continue;

                DateTime date;
                if (preset?.DateFormat != null)
                {
                    DateTime.TryParseExact(dateStr, preset.DateFormat, CultureInfo.InvariantCulture,
                        DateTimeStyles.None, out date);
                }
                else
                {
                    DateTime.TryParse(dateStr, CultureInfo.InvariantCulture, DateTimeStyles.None, out date);
                }

                if (date == default) continue;

                decimal amount;
                bool isDebit;

                if (amountCol >= 0)
                {
                    var amountStr = csv.GetField(amountCol)?.Trim()
                        .Replace("R", "").Replace(" ", "").Replace(",", "");
                    if (!decimal.TryParse(amountStr, NumberStyles.Any, CultureInfo.InvariantCulture, out amount))
                        continue;

                    isDebit = amount < 0;
                    amount = Math.Abs(amount);
                }
                else
                {
                    var debitStr = csv.GetField(debitCol)?.Trim()
                        .Replace("R", "").Replace(" ", "").Replace(",", "");
                    var creditStr = creditCol >= 0 ? csv.GetField(creditCol)?.Trim()
                        .Replace("R", "").Replace(" ", "").Replace(",", "") : null;

                    if (decimal.TryParse(debitStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var debitAmount) && debitAmount != 0)
                    {
                        amount = Math.Abs(debitAmount);
                        isDebit = true;
                    }
                    else if (decimal.TryParse(creditStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var creditAmount) && creditAmount != 0)
                    {
                        amount = Math.Abs(creditAmount);
                        isDebit = false;
                    }
                    else
                    {
                        continue;
                    }
                }

                transactions.Add(new ParsedTransaction(
                    DateTime.SpecifyKind(date, DateTimeKind.Utc),
                    description,
                    amount,
                    isDebit,
                    ExtractMerchant(description)
                ));
            }
            catch (FormatException)
            {
                // Skip unparseable rows
            }
            catch (InvalidOperationException)
            {
                // Skip rows with missing/invalid fields
            }
        }

        return transactions;
    }

    private static BankPreset? DetectBank(string content)
    {
        var lower = content.ToLowerInvariant();

        if (lower.Contains("fnb") || lower.Contains("first national"))
            return BankPresets["fnb"];
        if (lower.Contains("nedbank"))
            return BankPresets["nedbank"];
        if (lower.Contains("capitec"))
            return BankPresets["capitec"];
        if (lower.Contains("standard bank"))
            return BankPresets["standard"];
        if (lower.Contains("absa"))
            return BankPresets["absa"];

        return null;
    }

    private static int FindColumn(string[] headers, string? preferred, params string[] alternatives)
    {
        if (preferred != null)
        {
            for (int i = 0; i < headers.Length; i++)
            {
                if (headers[i].Equals(preferred, StringComparison.OrdinalIgnoreCase))
                    return i;
            }
        }

        foreach (var alt in alternatives)
        {
            for (int i = 0; i < headers.Length; i++)
            {
                if (headers[i].Trim().Equals(alt, StringComparison.OrdinalIgnoreCase))
                    return i;
            }
        }

        return -1;
    }

    private static string? ExtractMerchant(string description)
    {
        // Simple merchant extraction: take first meaningful segment
        var parts = description.Split(new[] { " - ", " at ", "*", "//", "  " }, StringSplitOptions.RemoveEmptyEntries);
        var merchant = parts.FirstOrDefault()?.Trim();
        return string.IsNullOrWhiteSpace(merchant) || merchant.Length < 3 ? null : merchant;
    }

    private record BankPreset(
        string DateColumn,
        string DescriptionColumn,
        string AmountColumn,
        string? DebitColumn,
        string DateFormat
    );
}
