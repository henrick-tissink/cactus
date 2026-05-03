using System.Globalization;
using System.Xml.Linq;
using Cactus.Application.Common.Interfaces;

namespace Cactus.Infrastructure.Services.Parsing;

public class OfxStatementParser
{
    public async Task<List<ParsedTransaction>> ParseAsync(Stream stream, CancellationToken cancellationToken)
    {
        using var reader = new StreamReader(stream);
        var content = await reader.ReadToEndAsync(cancellationToken);

        // Strip SGML headers (everything before <OFX>)
        var ofxStart = content.IndexOf("<OFX>", StringComparison.OrdinalIgnoreCase);
        if (ofxStart < 0)
            ofxStart = content.IndexOf("<ofx>", StringComparison.OrdinalIgnoreCase);
        if (ofxStart < 0)
            throw new InvalidOperationException("Invalid OFX file: could not find <OFX> tag");

        var xmlContent = content[ofxStart..];

        // OFX uses SGML-style tags without closing — fix them for XML parsing
        xmlContent = FixSgmlTags(xmlContent);

        var doc = XDocument.Parse(xmlContent);

        var transactions = new List<ParsedTransaction>();

        // Find all STMTTRN elements
        var stmtTrns = doc.Descendants()
            .Where(e => e.Name.LocalName.Equals("STMTTRN", StringComparison.OrdinalIgnoreCase));

        foreach (var trn in stmtTrns)
        {
            try
            {
                var dtPosted = GetElementValue(trn, "DTPOSTED");
                var trnAmt = GetElementValue(trn, "TRNAMT");
                var name = GetElementValue(trn, "NAME");
                var memo = GetElementValue(trn, "MEMO");

                if (string.IsNullOrEmpty(dtPosted) || string.IsNullOrEmpty(trnAmt))
                    continue;

                // Parse date (format: YYYYMMDDHHMMSS or YYYYMMDD)
                var dateStr = dtPosted.Length >= 8 ? dtPosted[..8] : dtPosted;
                if (!DateTime.TryParseExact(dateStr, "yyyyMMdd", CultureInfo.InvariantCulture,
                    DateTimeStyles.None, out var date))
                    continue;

                if (!decimal.TryParse(trnAmt, NumberStyles.Any, CultureInfo.InvariantCulture, out var amount))
                    continue;

                var description = !string.IsNullOrEmpty(name) ? name :
                    !string.IsNullOrEmpty(memo) ? memo : "Unknown";

                transactions.Add(new ParsedTransaction(
                    DateTime.SpecifyKind(date, DateTimeKind.Utc),
                    description.Trim(),
                    Math.Abs(amount),
                    amount < 0,
                    !string.IsNullOrEmpty(name) ? name.Trim() : null
                ));
            }
            catch (FormatException)
            {
                // Skip unparseable transactions
            }
            catch (InvalidOperationException)
            {
                // Skip transactions with missing/invalid fields
            }
        }

        return transactions;
    }

    private static string? GetElementValue(XElement parent, string name)
    {
        var element = parent.Elements()
            .FirstOrDefault(e => e.Name.LocalName.Equals(name, StringComparison.OrdinalIgnoreCase));
        return element?.Value?.Trim();
    }

    private static string FixSgmlTags(string content)
    {
        // Simple SGML to XML fixer: close unclosed tags
        var lines = content.Split('\n');
        var result = new System.Text.StringBuilder();

        var selfClosingTags = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "TRNTYPE", "DTPOSTED", "DTUSER", "TRNAMT", "FITID", "NAME", "MEMO",
            "CHECKNUM", "REFNUM", "BALAMT", "DTASOF", "ACCTID", "BANKID",
            "ACCTTYPE", "CURDEF", "DTSTART", "DTEND", "DTSERVER", "LANGUAGE",
            "ORG", "FID", "SEVERITY", "CODE", "MESSAGE"
        };

        foreach (var line in lines)
        {
            var trimmed = line.Trim();
            if (string.IsNullOrEmpty(trimmed))
            {
                result.AppendLine(trimmed);
                continue;
            }

            // Check if line is like <TAG>value (no closing tag)
            if (trimmed.StartsWith('<') && !trimmed.StartsWith("</"))
            {
                var tagEnd = trimmed.IndexOf('>');
                if (tagEnd > 0)
                {
                    var tag = trimmed[1..tagEnd];
                    var afterTag = trimmed[(tagEnd + 1)..];

                    if (!string.IsNullOrEmpty(afterTag) && !afterTag.Contains('<') &&
                        selfClosingTags.Contains(tag))
                    {
                        result.AppendLine($"<{tag}>{afterTag}</{tag}>");
                        continue;
                    }
                }
            }

            result.AppendLine(trimmed);
        }

        return result.ToString();
    }
}
