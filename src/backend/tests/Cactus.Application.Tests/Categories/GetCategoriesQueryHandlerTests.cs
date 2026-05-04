using Cactus.Application.Common.Interfaces;
using Cactus.Application.Features.Categories.Queries;
using Cactus.Application.Tests._Common;
using Cactus.Domain.Entities;
using Cactus.Domain.Enums;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Cactus.Application.Tests.Categories;

public class GetCategoriesQueryHandlerTests : HandlerTestBase
{
    private readonly ICurrentUserService _currentUser = Substitute.For<ICurrentUserService>();

    [Fact]
    public async Task GetCategories_returns_macro_categories_with_nested_categories()
    {
        // Arrange: seed one MacroCategory with one Category
        var macroCategory = new MacroCategory
        {
            Type        = MacroCategoryType.Needs,
            Name        = "Housing",
            Description = "Housing and utilities",
            DisplayOrder = 1,
        };
        Context.MacroCategories.Add(macroCategory);
        await Context.SaveChangesAsync(default);

        var category = new Category
        {
            MacroCategoryId = macroCategory.Id,
            Name            = "Rent",
            DisplayOrder    = 1,
            IsSystem        = true,
        };
        Context.Categories.Add(category);
        await Context.SaveChangesAsync(default);

        _currentUser.UserId.Returns(Guid.NewGuid()); // user id irrelevant for system categories

        var handler = new GetCategoriesQueryHandler(Context, _currentUser);

        // Act
        var result = await handler.Handle(new GetCategoriesQuery(), CancellationToken.None);

        // Assert
        result.Should().ContainSingle();
        result[0].Id.Should().Be(macroCategory.Id);
        result[0].Name.Should().Be("Housing");
        result[0].Type.Should().Be(MacroCategoryType.Needs);
        result[0].Categories.Should().ContainSingle(c => c.Name == "Rent");
    }
}
