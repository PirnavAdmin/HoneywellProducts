using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Honeywell.Data;
using Honeywell.Controllers;

namespace Honeywell.Helpers
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true, Inherited = true)]
    public class AuthorizeModuleAttribute : Attribute, IAsyncActionFilter
    {
        private readonly string[] _requiredModules;

        public AuthorizeModuleAttribute(params string[] requiredModules)
        {
            _requiredModules = requiredModules ?? Array.Empty<string>();
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var user = context.HttpContext.User;
            var isAuthenticated = user?.Identity?.IsAuthenticated == true;

            string? role = user?.FindFirst(ClaimTypes.Role)?.Value ?? user?.FindFirst("role")?.Value;
            string? email = user?.FindFirst(ClaimTypes.Email)?.Value
                         ?? user?.FindFirst("email")?.Value
                         ?? user?.Identity?.Name;

            if (string.IsNullOrWhiteSpace(email) && context.HttpContext.Request.Headers.TryGetValue("X-User-Email", out var headerEmail))
            {
                email = headerEmail.ToString();
            }

            // If completely unauthenticated and no valid email can be derived
            if (!isAuthenticated && string.IsNullOrWhiteSpace(email))
            {
                context.Result = new ObjectResult(new { success = false, message = "Authentication required. Please provide a valid Bearer token." })
                {
                    StatusCode = 401
                };
                return;
            }

            // SuperAdmin and Admin have unrestricted access
            if (!string.IsNullOrWhiteSpace(role) &&
                (role.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase) ||
                 role.Equals("Admin", StringComparison.OrdinalIgnoreCase) ||
                 role.Equals("Administrator", StringComparison.OrdinalIgnoreCase)))
            {
                await next();
                return;
            }

            // For Staff, Manager, Sales, Inventory, Advisory, etc. Check module permissions
            var dbContext = context.HttpContext.RequestServices.GetService<ApplicationDbContext>();
            var allowedModules = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            // 1. Try reading permissions claim from JWT
            var permissionsClaim = user?.FindFirst("permissions")?.Value;
            bool permissionsLoadedFromClaim = false;

            if (!string.IsNullOrWhiteSpace(permissionsClaim))
            {
                try
                {
                    var permsList = JsonSerializer.Deserialize<List<string>>(permissionsClaim);
                    if (permsList != null)
                    {
                        foreach (var p in permsList) allowedModules.Add(p.Trim());
                        permissionsLoadedFromClaim = true;
                    }
                }
                catch { }
            }

            // 2. If not loaded from claim, look up Staff or User record in database
            if (!permissionsLoadedFromClaim && dbContext != null && !string.IsNullOrWhiteSpace(email))
            {
                var cleanEmail = email.Trim().ToLowerInvariant();
                var staffEntity = await dbContext.Staff.FirstOrDefaultAsync(s =>
                    s.Email.ToLower() == cleanEmail ||
                    s.EmployeeId.ToLower() == cleanEmail);

                if (staffEntity != null)
                {
                    if (!staffEntity.IsActive)
                    {
                        context.Result = new ObjectResult(new { success = false, message = "Staff account is inactive. Please contact administrator." })
                        {
                            StatusCode = 403
                        };
                        return;
                    }

                    role ??= staffEntity.Role;

                    if (!string.IsNullOrWhiteSpace(role) &&
                        (role.Equals("Admin", StringComparison.OrdinalIgnoreCase) ||
                         role.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase) ||
                         role.Equals("Administrator", StringComparison.OrdinalIgnoreCase)))
                    {
                        await next();
                        return;
                    }

                    // If PermissionsJson is null (unconfigured), apply RoleDefaultPermissions
                    if (staffEntity.PermissionsJson == null)
                    {
                        var roleKey = (staffEntity.Role ?? "staff").Trim().ToLowerInvariant();
                        if (StaffController.RoleDefaultPermissions.TryGetValue(roleKey, out var defs))
                        {
                            foreach (var p in defs) allowedModules.Add(p.Trim());
                        }
                    }
                    else
                    {
                        foreach (var p in staffEntity.Permissions) allowedModules.Add(p.Trim());
                    }
                }
                else
                {
                    // Fallback to Users table
                    var userEntity = await dbContext.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == cleanEmail);
                    if (userEntity != null)
                    {
                        role ??= userEntity.Role;
                        if (!string.IsNullOrWhiteSpace(role) &&
                            (role.Equals("Admin", StringComparison.OrdinalIgnoreCase) ||
                             role.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase) ||
                             role.Equals("Administrator", StringComparison.OrdinalIgnoreCase)))
                        {
                            await next();
                            return;
                        }

                        if (!string.IsNullOrWhiteSpace(userEntity.PermissionsJson))
                        {
                            try
                            {
                                var uPerms = JsonSerializer.Deserialize<List<string>>(userEntity.PermissionsJson);
                                if (uPerms != null)
                                {
                                    foreach (var p in uPerms) allowedModules.Add(p.Trim());
                                }
                            }
                            catch { }
                        }
                    }
                }
            }

            // If no specific required modules were given, access is granted to authenticated staff
            if (_requiredModules.Length == 0)
            {
                await next();
                return;
            }

            // Check if any of the required modules matches allowedModules (with common alias mappings)
            bool hasAccess = _requiredModules.Any(req =>
            {
                if (allowedModules.Contains(req)) return true;

                // Alias checks
                if (req.Equals("catalog", StringComparison.OrdinalIgnoreCase) &&
                    (allowedModules.Contains("products") || allowedModules.Contains("categories") || allowedModules.Contains("brands")))
                    return true;

                if (req.Equals("inventory", StringComparison.OrdinalIgnoreCase) &&
                    (allowedModules.Contains("stockupdates") || allowedModules.Contains("stock") || allowedModules.Contains("warehouse")))
                    return true;

                if (req.Equals("stockupdates", StringComparison.OrdinalIgnoreCase) &&
                    (allowedModules.Contains("inventory") || allowedModules.Contains("stock")))
                    return true;

                if (req.Equals("orders", StringComparison.OrdinalIgnoreCase) &&
                    (allowedModules.Contains("orders & sales") || allowedModules.Contains("sales")))
                    return true;

                return false;
            });

            if (!hasAccess)
            {
                context.Result = new ObjectResult(new
                {
                    success = false,
                    message = $"Access denied. Staff role '{role ?? "Staff"}' lacks required permission for module: '{string.Join(", ", _requiredModules)}'."
                })
                {
                    StatusCode = 403
                };
                return;
            }

            await next();
        }
    }
}
