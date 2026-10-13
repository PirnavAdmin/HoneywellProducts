using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Honeywell.Data;
using Honeywell.Models;

namespace Honeywell.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminProfileController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminProfileController(ApplicationDbContext context)
        {
            _context = context;
        }

        private sealed class ResolvedIdentity
        {
            public string? Email { get; set; }
            public string? Identifier { get; set; }
            public string? FullName { get; set; }
            public string? Role { get; set; }
            public string? MobileNumber { get; set; }
            public string? EmployeeId { get; set; }
            public List<string>? Permissions { get; set; }
            public bool HasExplicitTokenOrParam { get; set; }
        }

        // Resolves the logged-in user's identity from User.Claims, Bearer JWT payload, custom headers, or query params
        private ResolvedIdentity ResolveLoggedInIdentity()
        {
            var resolved = new ResolvedIdentity();

            // 1. Read from authenticated User.Claims (populated by JwtBearer middleware)
            if (User?.Claims != null && User.Claims.Any())
            {
                resolved.Email = User.FindFirst(ClaimTypes.Email)?.Value
                    ?? User.FindFirst("email")?.Value
                    ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value
                    ?? User.Identity?.Name
                    ?? User.FindFirst(ClaimTypes.Name)?.Value
                    ?? User.FindFirst("unique_name")?.Value;

                resolved.Identifier = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("sub")?.Value
                    ?? User.FindFirst("nameid")?.Value
                    ?? User.FindFirst("employeeId")?.Value
                    ?? resolved.Email;

                resolved.Role = User.FindFirst(ClaimTypes.Role)?.Value
                    ?? User.FindFirst("role")?.Value;

                resolved.FullName = User.FindFirst("fullName")?.Value
                    ?? User.FindFirst("name")?.Value
                    ?? User.FindFirst(ClaimTypes.GivenName)?.Value;

                resolved.EmployeeId = User.FindFirst("employeeId")?.Value;
                resolved.MobileNumber = User.FindFirst("mobileNumber")?.Value;

                if (!string.IsNullOrWhiteSpace(resolved.Email) || !string.IsNullOrWhiteSpace(resolved.Identifier))
                {
                    resolved.HasExplicitTokenOrParam = true;
                }
            }

            // 2. Also inspect Authorization: Bearer <token> payload directly (handles client-minted or custom JWTs)
            if (Request.Headers.TryGetValue("Authorization", out var authHeader))
            {
                var raw = authHeader.ToString().Trim();
                if (raw.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    var tokenPart = raw.Substring("Bearer ".Length).Trim();
                    var segments = tokenPart.Split('.');
                    if (segments.Length >= 2)
                    {
                        try
                        {
                            var payloadSegment = segments[1].Replace('-', '+').Replace('_', '/');
                            switch (payloadSegment.Length % 4)
                            {
                                case 2: payloadSegment += "=="; break;
                                case 3: payloadSegment += "="; break;
                            }
                            var jsonBytes = Convert.FromBase64String(payloadSegment);
                            using var doc = JsonDocument.Parse(jsonBytes);
                            var root = doc.RootElement;
                            if (root.ValueKind == JsonValueKind.Object)
                            {
                                string? GetClaim(params string[] names)
                                {
                                    foreach (var n in names)
                                    {
                                        foreach (var prop in root.EnumerateObject())
                                        {
                                            if (prop.Name.Equals(n, StringComparison.OrdinalIgnoreCase) &&
                                                (prop.Value.ValueKind == JsonValueKind.String || prop.Value.ValueKind == JsonValueKind.Number))
                                            {
                                                var val = prop.Value.ToString();
                                                if (!string.IsNullOrWhiteSpace(val)) return val;
                                            }
                                        }
                                    }
                                    return null;
                                }

                                resolved.Email ??= GetClaim(
                                    "email",
                                    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
                                    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
                                    "unique_name",
                                    "sub");

                                resolved.Identifier ??= GetClaim(
                                    "nameid",
                                    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
                                    "employeeId",
                                    "id",
                                    "sub") ?? resolved.Email;

                                resolved.Role ??= GetClaim(
                                    "role",
                                    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role");

                                resolved.FullName ??= GetClaim("fullName", "name", "given_name");
                                resolved.EmployeeId ??= GetClaim("employeeId");
                                resolved.MobileNumber ??= GetClaim("mobileNumber", "phone", "mobile");

                                foreach (var prop in root.EnumerateObject())
                                {
                                    if (prop.Name.Equals("permissions", StringComparison.OrdinalIgnoreCase) &&
                                        prop.Value.ValueKind == JsonValueKind.Array)
                                    {
                                        resolved.Permissions = prop.Value.EnumerateArray()
                                            .Where(x => x.ValueKind == JsonValueKind.String)
                                            .Select(x => x.GetString()!)
                                            .Where(x => !string.IsNullOrWhiteSpace(x))
                                            .ToList();
                                    }
                                }

                                if (!string.IsNullOrWhiteSpace(resolved.Email) || !string.IsNullOrWhiteSpace(resolved.Identifier))
                                {
                                    resolved.HasExplicitTokenOrParam = true;
                                }
                            }
                        }
                        catch { }
                    }
                }
            }

            // 3. Check custom request headers
            if (string.IsNullOrWhiteSpace(resolved.Email))
            {
                var headerKeys = new[] { "email", "useremail", "user-email", "x-email", "x-user-email" };
                foreach (var key in headerKeys)
                {
                    var headerVal = Request.Headers.FirstOrDefault(h => h.Key.Equals(key, StringComparison.OrdinalIgnoreCase)).Value;
                    if (!string.IsNullOrWhiteSpace(headerVal))
                    {
                        resolved.Email = headerVal.ToString().Trim();
                        resolved.Identifier ??= resolved.Email;
                        resolved.HasExplicitTokenOrParam = true;
                        break;
                    }
                }
            }

            // 4. Check query string parameters
            if (string.IsNullOrWhiteSpace(resolved.Email))
            {
                var queryKeys = new[] { "email", "useremail", "id" };
                foreach (var key in queryKeys)
                {
                    var queryVal = Request.Query.FirstOrDefault(q => q.Key.Equals(key, StringComparison.OrdinalIgnoreCase)).Value;
                    if (!string.IsNullOrWhiteSpace(queryVal))
                    {
                        resolved.Email = queryVal.ToString().Trim();
                        resolved.Identifier ??= resolved.Email;
                        resolved.HasExplicitTokenOrParam = true;
                        break;
                    }
                }
            }

            return resolved;
        }

        private async Task<(User? user, Staff? staff)> FindUserAndStaffAsync(ResolvedIdentity identity)
        {
            User? admin = null;
            Staff? staff = null;

            var emailKey = identity.Email?.Trim().ToLowerInvariant();
            var idKey = identity.Identifier?.Trim().ToLowerInvariant();

            if (!string.IsNullOrWhiteSpace(emailKey))
            {
                admin = await _context.Users.FirstOrDefaultAsync(u =>
                    u.Email.ToLower() == emailKey ||
                    (u.EmployeeId != null && u.EmployeeId.ToLower() == emailKey));

                try
                {
                    staff = await _context.Staff.FirstOrDefaultAsync(s =>
                        s.Email.ToLower() == emailKey ||
                        s.EmployeeId.ToLower() == emailKey);
                }
                catch { }
            }

            if (admin == null && staff == null && !string.IsNullOrWhiteSpace(idKey))
            {
                admin = await _context.Users.FirstOrDefaultAsync(u =>
                    u.Email.ToLower() == idKey ||
                    (u.EmployeeId != null && u.EmployeeId.ToLower() == idKey));

                try
                {
                    if (int.TryParse(idKey, out int numericId))
                    {
                        staff = await _context.Staff.FirstOrDefaultAsync(s => s.Id == numericId);
                    }
                    staff ??= await _context.Staff.FirstOrDefaultAsync(s =>
                        s.EmployeeId.ToLower() == idKey ||
                        s.Email.ToLower() == idKey);
                }
                catch { }
            }

            // Only fall back to default seeded admin when NO Bearer token / header / query parameter was supplied
            if (admin == null && staff == null && !identity.HasExplicitTokenOrParam)
            {
                admin = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == "bhargavakurapati49@gmail.com")
                    ?? await _context.Users.FirstOrDefaultAsync();
            }

            return (admin, staff);
        }

        private object BuildProfileResponse(User? admin, Staff? staff, ResolvedIdentity identity, string? message = null)
        {
            string email = staff?.Email
                ?? admin?.Email
                ?? identity.Email
                ?? "bhargavakurapati49@gmail.com";

            string username = email.Contains("@") ? email.Split('@')[0] : email;

            string fullName = (!string.IsNullOrWhiteSpace(staff?.Name) ? staff.Name : null)
                ?? (!string.IsNullOrWhiteSpace(admin?.FullName) ? admin.FullName : null)
                ?? (!string.IsNullOrWhiteSpace(identity.FullName) ? identity.FullName : null)
                ?? username;

            var nameParts = fullName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            string firstName = !string.IsNullOrWhiteSpace(staff?.FirstName)
                ? staff.FirstName
                : (nameParts.Length > 0 ? nameParts[0] : fullName);
            string lastName = !string.IsNullOrWhiteSpace(staff?.LastName)
                ? staff.LastName
                : (nameParts.Length > 1 ? string.Join(" ", nameParts.Skip(1)) : "");

            string mobileNumber = (!string.IsNullOrWhiteSpace(staff?.MobileNumber) ? staff.MobileNumber : null)
                ?? (!string.IsNullOrWhiteSpace(staff?.Phone) ? staff.Phone : null)
                ?? (!string.IsNullOrWhiteSpace(admin?.MobileNumber) ? admin.MobileNumber : null)
                ?? (!string.IsNullOrWhiteSpace(identity.MobileNumber) ? identity.MobileNumber : null)
                ?? "+91 9876543210";

            string employeeId = (!string.IsNullOrWhiteSpace(staff?.EmployeeId) ? staff.EmployeeId : null)
                ?? (!string.IsNullOrWhiteSpace(admin?.EmployeeId) ? admin.EmployeeId : null)
                ?? (!string.IsNullOrWhiteSpace(identity.EmployeeId) ? identity.EmployeeId : null)
                ?? (staff != null && staff.Id > 0 ? $"EMP-{staff.Id:D4}" : "#SA001");

            // Prefer the specific role from Staff if this user is a Staff/Manager member, otherwise User.Role
            string role = (!string.IsNullOrWhiteSpace(staff?.Role) &&
                           (admin == null || !admin.Role.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase)))
                ? staff.Role
                : (admin?.Role ?? staff?.Role ?? identity.Role ?? "Admin");

            bool isSuperAdmin = role.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase) ||
                                role.Equals("Super Admin", StringComparison.OrdinalIgnoreCase);
            bool isAdmin = isSuperAdmin || role.Equals("Admin", StringComparison.OrdinalIgnoreCase);

            string roleLabel = isSuperAdmin
                ? "SUPER ADMINISTRATOR"
                : isAdmin
                    ? "ADMINISTRATOR"
                    : role.ToUpperInvariant();

            string systemAccess = isSuperAdmin
                ? "Full System Access Granted (All Screens)"
                : "Standard System Access (Limited Screens)";

            bool isActive = staff?.IsActive ?? admin?.IsActive ?? true;
            DateTime createdDate = staff?.DateJoined ?? admin?.CreatedDate ?? DateTime.UtcNow;

            var permissions = staff?.Permissions != null && staff.Permissions.Count > 0
                ? staff.Permissions
                : (identity.Permissions ?? new List<string>());

            var profileObj = new
            {
                id = staff?.Id ?? 1,
                username = username,
                fullName = fullName,
                name = fullName,
                firstName = firstName,
                lastName = lastName,
                email = email,
                mobile = mobileNumber,
                phone = mobileNumber,
                phoneNumber = mobileNumber,
                mobileNumber = mobileNumber,
                employeeId = employeeId,
                role = role,
                roleLabel = roleLabel,
                isActive = isActive,
                address = "101, Jain Sadguru Capital Park, Hitech City, Madhapur, Hyderabad - 500081, Telangana",
                permissions = permissions,
                systemAccess = systemAccess,
                createdDate = createdDate.ToString("yyyy-MM-ddTHH:mm:ss")
            };

            return new
            {
                success = true,
                message = message ?? "Profile retrieved successfully.",
                id = profileObj.id,
                username = profileObj.username,
                fullName = profileObj.fullName,
                name = profileObj.name,
                firstName = profileObj.firstName,
                lastName = profileObj.lastName,
                email = profileObj.email,
                mobile = profileObj.mobile,
                phone = profileObj.phone,
                phoneNumber = profileObj.phoneNumber,
                mobileNumber = profileObj.mobileNumber,
                employeeId = profileObj.employeeId,
                role = profileObj.role,
                roleLabel = profileObj.roleLabel,
                isActive = profileObj.isActive,
                address = profileObj.address,
                permissions = profileObj.permissions,
                systemAccess = profileObj.systemAccess,
                createdDate = profileObj.createdDate,
                profile = profileObj,
                data = profileObj
            };
        }

        // GET: api/AdminProfile
        [HttpGet]
        [HttpGet("settings")]
        public async Task<IActionResult> GetProfile()
        {
            var identity = ResolveLoggedInIdentity();
            var (admin, staff) = await FindUserAndStaffAsync(identity);

            if (admin == null && staff == null && !identity.HasExplicitTokenOrParam)
            {
                return NotFound(new { success = false, message = "Admin profile not found." });
            }

            return Ok(BuildProfileResponse(admin, staff, identity));
        }

        // PUT: api/AdminProfile
        // PUT: api/AdminProfile/settings
        // POST: api/AdminProfile/settings
        // POST: api/AdminProfile
        [HttpPut]
        [HttpPut("settings")]
        [HttpPost("settings")]
        [HttpPost]
        public async Task<IActionResult> UpdateProfile([FromBody] AdminProfileUpdateRequest request)
        {
            request ??= new AdminProfileUpdateRequest();
            var identity = ResolveLoggedInIdentity();
            if (string.IsNullOrWhiteSpace(identity.Email) && !string.IsNullOrWhiteSpace(request.Email))
            {
                identity.Email = request.Email.Trim();
                identity.Identifier ??= identity.Email;
                identity.HasExplicitTokenOrParam = true;
            }

            var (admin, staff) = await FindUserAndStaffAsync(identity);

            if (admin == null && staff == null)
            {
                return NotFound(new { success = false, message = "Admin profile not found." });
            }

            // If changing password
            if (!string.IsNullOrEmpty(request.NewPassword))
            {
                if (!string.IsNullOrEmpty(request.ConfirmNewPassword) && request.NewPassword != request.ConfirmNewPassword)
                {
                    return BadRequest(new { success = false, message = "Passwords do not match." });
                }
                if (admin != null) admin.Password = request.NewPassword;
                if (staff != null) staff.Password = request.NewPassword;
            }

            var updatedFullName = !string.IsNullOrWhiteSpace(request.FullName)
                ? request.FullName.Trim()
                : !string.IsNullOrWhiteSpace(request.Name)
                    ? request.Name.Trim()
                    : (!string.IsNullOrWhiteSpace(request.FirstName) || !string.IsNullOrWhiteSpace(request.LastName))
                        ? $"{request.FirstName} {request.LastName}".Trim()
                        : null;

            var updatedMobile = !string.IsNullOrWhiteSpace(request.MobileNumber)
                ? request.MobileNumber.Trim()
                : !string.IsNullOrWhiteSpace(request.Mobile)
                    ? request.Mobile.Trim()
                    : !string.IsNullOrWhiteSpace(request.Phone)
                        ? request.Phone.Trim()
                        : null;

            if (admin != null)
            {
                if (!string.IsNullOrWhiteSpace(updatedFullName)) admin.FullName = updatedFullName;
                if (!string.IsNullOrWhiteSpace(updatedMobile)) admin.MobileNumber = updatedMobile;
                if (!string.IsNullOrWhiteSpace(request.EmployeeId)) admin.EmployeeId = request.EmployeeId;
            }

            if (staff != null)
            {
                if (!string.IsNullOrWhiteSpace(updatedFullName))
                {
                    staff.Name = updatedFullName;
                    var parts = updatedFullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                    staff.FirstName = parts.Length > 0 ? parts[0] : updatedFullName;
                    staff.LastName = parts.Length > 1 ? string.Join(" ", parts.Skip(1)) : "";
                }
                if (!string.IsNullOrWhiteSpace(request.FirstName)) staff.FirstName = request.FirstName.Trim();
                if (!string.IsNullOrWhiteSpace(request.LastName)) staff.LastName = request.LastName.Trim();
                if (!string.IsNullOrWhiteSpace(updatedMobile))
                {
                    staff.MobileNumber = updatedMobile;
                    staff.Phone = updatedMobile;
                }
                if (!string.IsNullOrWhiteSpace(request.EmployeeId)) staff.EmployeeId = request.EmployeeId;
                staff.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(BuildProfileResponse(admin, staff, identity, "Admin profile updated successfully."));
        }

        public class AdminProfileUpdateRequest
        {
            public string? FullName { get; set; }
            public string? Name { get; set; }
            public string? FirstName { get; set; }
            public string? LastName { get; set; }
            public string? Email { get; set; }
            public string? MobileNumber { get; set; }
            public string? Mobile { get; set; }
            public string? Phone { get; set; }
            public string? Address { get; set; }
            public string? EmployeeId { get; set; }
            public string? NewPassword { get; set; }
            public string? ConfirmNewPassword { get; set; }
        }
    }
}
