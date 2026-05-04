using Cactus.Application.Tests._Common;
using FluentAssertions;
using Xunit;

namespace Cactus.Application.Tests;

public class SmokeTests : HandlerTestBase
{
    [Fact]
    public async Task DbContext_can_create_and_query_user()
    {
        var user = TestDataFactory.User("smoke@example.test");
        Context.Users.Add(user);
        await Context.SaveChangesAsync(default);

        var fetched = await Context.Users.FindAsync(user.Id);
        fetched.Should().NotBeNull();
        fetched!.Email.Should().Be("smoke@example.test");
    }
}
