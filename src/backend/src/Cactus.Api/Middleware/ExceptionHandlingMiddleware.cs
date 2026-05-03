using System.Net;
using System.Text.Json;
using FluentValidation;

namespace Cactus.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var response = context.Response;
        response.ContentType = "application/json";

        var errorResponse = new ErrorResponse { Error = "An error occurred" };

        switch (exception)
        {
            case ValidationException validationException:
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                errorResponse.Error = "Validation failed";
                errorResponse.Details = string.Join("; ", validationException.Errors.Select(e => $"{e.PropertyName}: {e.ErrorMessage}"));
                errorResponse.FieldErrors = validationException.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(
                        g => ToCamelCase(g.Key),
                        g => g.Select(e => e.ErrorMessage).ToArray()
                    );
                _logger.LogWarning("Validation failed: {Errors}", errorResponse.Details);
                break;

            case UnauthorizedAccessException:
                response.StatusCode = (int)HttpStatusCode.Unauthorized;
                errorResponse.Error = "Unauthorized";
                _logger.LogWarning("Unauthorized access attempt");
                break;

            case KeyNotFoundException:
                response.StatusCode = (int)HttpStatusCode.NotFound;
                errorResponse.Error = "Resource not found";
                _logger.LogWarning(exception, "Resource not found");
                break;

            case ArgumentException argumentException:
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                errorResponse.Error = argumentException.Message;
                _logger.LogWarning(exception, "Bad request: {Message}", argumentException.Message);
                break;

            default:
                response.StatusCode = (int)HttpStatusCode.InternalServerError;
                errorResponse.Error = "An unexpected error occurred";
                _logger.LogError(exception, "Unhandled exception: {Message}", exception.Message);
#if DEBUG
                errorResponse.Details = exception.ToString();
#endif
                break;
        }

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };

        await response.WriteAsync(JsonSerializer.Serialize(errorResponse, options));
    }

    private static string ToCamelCase(string str)
    {
        if (string.IsNullOrEmpty(str))
            return str;

        // Handle nested properties like "Request.Email"
        var parts = str.Split('.');
        for (int i = 0; i < parts.Length; i++)
        {
            if (!string.IsNullOrEmpty(parts[i]))
            {
                parts[i] = char.ToLowerInvariant(parts[i][0]) + parts[i][1..];
            }
        }
        return string.Join(".", parts);
    }
}

public class ErrorResponse
{
    public required string Error { get; set; }
    public string? Details { get; set; }
    public Dictionary<string, string[]>? FieldErrors { get; set; }
}

public static class ExceptionHandlingMiddlewareExtensions
{
    public static IApplicationBuilder UseExceptionHandling(this IApplicationBuilder app)
    {
        return app.UseMiddleware<ExceptionHandlingMiddleware>();
    }
}
