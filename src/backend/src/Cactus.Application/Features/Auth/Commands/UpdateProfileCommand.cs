using Cactus.Application.Common.Interfaces;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Auth.Commands;

public record UpdateProfileCommand(
    string? FirstName,
    string? LastName
) : IRequest<UpdateProfileResult>;

public record UpdateProfileResult(
    Guid UserId,
    string Email,
    string? FirstName,
    string? LastName
);

public class UpdateProfileCommandValidator : AbstractValidator<UpdateProfileCommand>
{
    public UpdateProfileCommandValidator()
    {
        RuleFor(x => x.FirstName).MaximumLength(100);
        RuleFor(x => x.LastName).MaximumLength(100);
    }
}

public class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, UpdateProfileResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UpdateProfileCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<UpdateProfileResult> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new KeyNotFoundException("User not found");

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;

        await _context.SaveChangesAsync(cancellationToken);

        return new UpdateProfileResult(user.Id, user.Email, user.FirstName, user.LastName);
    }
}
