using Cactus.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace Cactus.Infrastructure.Services;

public class ConsoleEmailService : IEmailService
{
    private readonly ILogger<ConsoleEmailService> _logger;

    public ConsoleEmailService(ILogger<ConsoleEmailService> logger)
    {
        _logger = logger;
    }

    public Task SendPasswordResetEmailAsync(string email, string resetToken, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "===== PASSWORD RESET EMAIL =====\nTo: {Email}\nReset Token: {ResetToken}\nReset URL: http://localhost:5173/reset-password?token={ResetUrl}\n================================",
            email, resetToken, resetToken);
        return Task.CompletedTask;
    }

    public Task SendEmailVerificationAsync(string email, string verificationToken, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "===== EMAIL VERIFICATION =====\nTo: {Email}\nVerification Token: {VerifyToken}\nVerify URL: http://localhost:5173/verify-email?token={VerifyUrl}\n==============================",
            email, verificationToken, verificationToken);
        return Task.CompletedTask;
    }
}
