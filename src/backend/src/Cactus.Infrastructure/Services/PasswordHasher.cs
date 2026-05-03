using Cactus.Application.Common.Interfaces;
using Isopoh.Cryptography.Argon2;

namespace Cactus.Infrastructure.Services;

public class PasswordHasher : IPasswordHasher
{
    public string Hash(string password)
    {
        return Argon2.Hash(password);
    }

    public bool Verify(string password, string hash)
    {
        return Argon2.Verify(hash, password);
    }
}
