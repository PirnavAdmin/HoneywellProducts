using Microsoft.IdentityModel.Tokens;
using Honeywell.Models;
using Honeywell.Services.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Honeywell.Services
{
    public class JwtService : IJwtService
    {
        private readonly IConfiguration _configuration;

        public JwtService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateToken(User user)
        {
            var email = user.Email ?? "";
            var role = string.IsNullOrWhiteSpace(user.Role) ? "Admin" : user.Role;
            var identifier = string.IsNullOrWhiteSpace(user.EmployeeId) ? email : user.EmployeeId;

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, email),
                new Claim(JwtRegisteredClaimNames.Email, email),
                new Claim(ClaimTypes.NameIdentifier, identifier),
                new Claim(ClaimTypes.Name, email),
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Role, role),
                new Claim("email", email),
                new Claim("role", role),
                new Claim("fullName", user.FullName ?? ""),
                new Claim("name", user.FullName ?? ""),
                new Claim("employeeId", user.EmployeeId ?? ""),
                new Claim("mobileNumber", user.MobileNumber ?? "")
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    _configuration["Jwt:Key"]));

            var creds = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(8),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler()
                .WriteToken(token);
        }


        public string GenerateTokenForCustomer(Customer customer)
        {
            var email = customer.Email ?? "";
            var role = string.IsNullOrWhiteSpace(customer.Role) ? "Customer Account" : customer.Role;
            var identifier = customer.Id.ToString();

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, email),
                new Claim(JwtRegisteredClaimNames.Email, email),
                new Claim(ClaimTypes.NameIdentifier, identifier),
                new Claim(ClaimTypes.Name, customer.Name ?? email),
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Role, role),
                new Claim("customerId", identifier),
                new Claim("email", email),
                new Claim("role", role),
                new Claim("phone", customer.Phone ?? "")
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    _configuration["Jwt:Key"] ?? "Honeywell2026@JWTSecretKey#1234567890"));

            var creds = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"] ?? "Honeywell",
                audience: _configuration["Jwt:Audience"] ?? "HoneywellUsers",
                claims: claims,
                expires: DateTime.UtcNow.AddDays(30),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler()
                .WriteToken(token);
        }
        public string GenerateTokenForTestUser(TestUser user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, user.MobileNumber),
                new Claim(ClaimTypes.Email, user.Email ?? ""),
                new Claim(ClaimTypes.GivenName, user.FullName ?? ""),
                new Claim(ClaimTypes.Role, "Grower")
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    _configuration["Jwt:Key"]));

            var creds = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(8),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler()
                .WriteToken(token);
        }
    }
}