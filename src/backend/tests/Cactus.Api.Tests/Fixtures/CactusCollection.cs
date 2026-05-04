using Xunit;

namespace Cactus.Api.Tests.Fixtures;

[CollectionDefinition(Name)]
public class CactusCollection : ICollectionFixture<CactusApiFactory>
{
    public const string Name = "Cactus";
}
