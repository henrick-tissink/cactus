using Cactus.Application.Common.Interfaces;
using Cactus.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Categories.Queries;

public record GetCategoriesQuery : IRequest<List<MacroCategoryDto>>;

public record MacroCategoryDto(
    Guid Id,
    MacroCategoryType Type,
    string Name,
    string Description,
    List<CategoryDto> Categories
);

public record CategoryDto(
    Guid Id,
    string Name,
    string? Icon,
    List<SubCategoryDto> SubCategories
);

public record SubCategoryDto(
    Guid Id,
    string Name
);

public class GetCategoriesQueryHandler : IRequestHandler<GetCategoriesQuery, List<MacroCategoryDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetCategoriesQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<MacroCategoryDto>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;

        var macroCategories = await _context.MacroCategories
            .Include(m => m.Categories.OrderBy(c => c.DisplayOrder))
            .ThenInclude(c => c.SubCategories.Where(s => s.UserId == null || s.UserId == userId).OrderBy(s => s.DisplayOrder))
            .OrderBy(m => m.DisplayOrder)
            .ToListAsync(cancellationToken);

        return macroCategories.Select(m => new MacroCategoryDto(
            m.Id,
            m.Type,
            m.Name,
            m.Description,
            m.Categories.Select(c => new CategoryDto(
                c.Id,
                c.Name,
                c.Icon,
                c.SubCategories.Select(s => new SubCategoryDto(s.Id, s.Name)).ToList()
            )).ToList()
        )).ToList();
    }
}
