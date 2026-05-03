using Cactus.Application.Features.Auth.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cactus.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("register")]
    public async Task<ActionResult<RegisterResult>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var command = new RegisterCommand(
                request.Email,
                request.Password,
                request.FirstName,
                request.LastName
            );

            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResult>> Login([FromBody] LoginRequest request)
    {
        try
        {
            var command = new LoginCommand(request.Email, request.Password);
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<RefreshTokenResult>> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        try
        {
            var command = new RefreshTokenCommand(request.RefreshToken);
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult> Logout([FromBody] LogoutRequest request)
    {
        await _mediator.Send(new LogoutCommand(request.RefreshToken));
        return Ok();
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<ActionResult<UpdateProfileResult>> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var command = new UpdateProfileCommand(request.FirstName, request.LastName);
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPut("change-password")]
    [Authorize]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        try
        {
            var command = new ChangePasswordCommand(request.CurrentPassword, request.NewPassword);
            await _mediator.Send(command);
            return Ok();
        }
        catch (UnauthorizedAccessException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        await _mediator.Send(new ForgotPasswordCommand(request.Email));
        return Ok(new { message = "If an account with that email exists, a reset link has been sent." });
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            await _mediator.Send(new ResetPasswordCommand(request.Token, request.NewPassword));
            return Ok(new { message = "Password has been reset successfully." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("verify-email")]
    public async Task<ActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        try
        {
            await _mediator.Send(new VerifyEmailCommand(request.Token));
            return Ok(new { message = "Email verified successfully." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("resend-verification")]
    [Authorize]
    public async Task<ActionResult> ResendVerification()
    {
        await _mediator.Send(new ResendVerificationCommand());
        return Ok(new { message = "If your email is not yet verified, a new verification link has been sent." });
    }
}

public record RegisterRequest(
    string Email,
    string Password,
    string? FirstName,
    string? LastName
);

public record LoginRequest(string Email, string Password);

public record RefreshTokenRequest(string RefreshToken);

public record LogoutRequest(string RefreshToken);

public record UpdateProfileRequest(string? FirstName, string? LastName);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public record ForgotPasswordRequest(string Email);

public record ResetPasswordRequest(string Token, string NewPassword);

public record VerifyEmailRequest(string Token);
