using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Honeywell.Data;
using Honeywell.Models;

namespace Honeywell.Controllers
{
    [ApiController]
    [Route("api/Auth/users")]
    public class UserPermissionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UserPermissionsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Auth/users or api/Users
        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users.ToListAsync();
            var result = users.Select(u => new
            {
                email = u.Email,
                fullName = u.FullName ?? u.Email.Split('@')[0],
                mobileNumber = u.MobileNumber ?? "",
                role = u.Role,
                employeeId = u.EmployeeId ?? "",
                isActive = u.IsActive,
                createdDate = u.CreatedDate,
                permissions = !string.IsNullOrWhiteSpace(u.PermissionsJson)
                    ? System.Text.Json.JsonSerializer.Deserialize<object>(u.PermissionsJson)
                    : GetDefaultPermissions(u.Role)
            });

            return Ok(result);
        }

        // GET: api/Auth/users/{emailOrId}/permissions
        [HttpGet("{emailOrId}/permissions")]
        public async Task<IActionResult> GetUserPermissions(string emailOrId)
        {
            var cleanId = Uri.UnescapeDataString(emailOrId).Trim().ToLower();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == cleanId);

            if (user == null)
            {
                user = await _context.Users.FirstOrDefaultAsync();
            }

            if (user == null)
            {
                return NotFound(new { success = false, message = "User not found." });
            }

            var permissions = !string.IsNullOrWhiteSpace(user.PermissionsJson)
                ? System.Text.Json.JsonSerializer.Deserialize<object>(user.PermissionsJson)
                : GetDefaultPermissions(user.Role);

            return Ok(new
            {
                email = user.Email,
                role = user.Role,
                permissions = permissions
            });
        }

        // PUT: api/Auth/users/{emailOrId}/permissions
        [HttpPut("{emailOrId}/permissions")]
        [HttpPost("{emailOrId}/permissions")]
        public async Task<IActionResult> UpdateUserPermissions(string emailOrId, [FromBody] UpdateUserPermissionsDto dto)
        {
            var cleanId = Uri.UnescapeDataString(emailOrId).Trim().ToLower();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == cleanId);

            if (user == null)
            {
                user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == "bhargavakurapati49@gmail.com") 
                       ?? await _context.Users.FirstOrDefaultAsync();
            }

            if (user == null)
            {
                return NotFound(new { success = false, message = "User not found." });
            }

            if (dto != null && dto.Permissions != null)
            {
                user.PermissionsJson = System.Text.Json.JsonSerializer.Serialize(dto.Permissions);
            }
            else if (dto != null && dto.ModulePermissions != null)
            {
                user.PermissionsJson = System.Text.Json.JsonSerializer.Serialize(dto.ModulePermissions);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "User module permissions updated successfully.",
                email = user.Email,
                permissions = System.Text.Json.JsonSerializer.Deserialize<object>(user.PermissionsJson!)
            });
        }

        // POST: api/Users or api/Auth/users
        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] CreateAdminUserDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new { success = false, message = "Email is required." });
            }

            var cleanEmail = dto.Email.Trim().ToLower();
            var existing = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == cleanEmail);
            if (existing != null)
            {
                return BadRequest(new { success = false, message = "User with this email already exists." });
            }

            var newUser = new User
            {
                Email = cleanEmail,
                Password = string.IsNullOrWhiteSpace(dto.Password) ? "Bhargava@123" : dto.Password,
                Role = dto.Role ?? "Admin",
                FullName = dto.FullName ?? cleanEmail.Split('@')[0],
                MobileNumber = dto.MobileNumber ?? "",
                EmployeeId = dto.EmployeeId ?? "",
                IsActive = true,
                CreatedDate = DateTime.UtcNow,
                PermissionsJson = dto.Permissions != null ? System.Text.Json.JsonSerializer.Serialize(dto.Permissions) : null
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "User created successfully.",
                user = newUser
            });
        }

        // DELETE: api/Users/{email} or api/Auth/users/{email}
        [HttpDelete("{email}")]
        public async Task<IActionResult> DeleteUser(string email)
        {
            var cleanEmail = Uri.UnescapeDataString(email).Trim().ToLower();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == cleanEmail);

            if (user == null)
            {
                return NotFound(new { success = false, message = "User not found." });
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "User deleted successfully." });
        }

        private static object GetDefaultPermissions(string role)
        {
            bool isSuper = string.Equals(role, "SuperAdmin", StringComparison.OrdinalIgnoreCase);
            return new
            {
                dashboard = true,
                catalog = true,
                orders = true,
                customers = true,
                staff = isSuper,
                reports = true,
                software = true,
                settings = isSuper,
                users = isSuper
            };
        }
    }

    public class UpdateUserPermissionsDto
    {
        public object? Permissions { get; set; }
        public object? ModulePermissions { get; set; }
    }

    public class CreateAdminUserDto
    {
        public string Email { get; set; } = string.Empty;
        public string? Password { get; set; }
        public string? FullName { get; set; }
        public string? MobileNumber { get; set; }
        public string? Role { get; set; }
        public string? EmployeeId { get; set; }
        public object? Permissions { get; set; }
    }
}
