using Honeywell.Models;

namespace Honeywell.Services.Interfaces
{
    public interface IJwtService
    {
        string GenerateToken(User user);
        string GenerateTokenForTestUser(TestUser user);
    }
}