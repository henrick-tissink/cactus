namespace Cactus.Application.Common.Interfaces;

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string email, string resetToken, CancellationToken cancellationToken = default);
    Task SendEmailVerificationAsync(string email, string verificationToken, CancellationToken cancellationToken = default);
}
