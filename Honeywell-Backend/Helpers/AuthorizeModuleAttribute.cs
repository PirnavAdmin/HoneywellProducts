using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Honeywell.Data;
using Honeywell.Controllers;

namespace Honeywell.Helpers
{
    [Flags]
    public enum PermissionAction
    {
        None = 0,
        View = 1,      // GET, HEAD
        Add = 2,       // POST
        Edit = 4,      // PUT, PATCH
        Delete = 8,    // DELETE
        All = View | Add | Edit | Delete
    }

    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true, Inherited = true)]
    public class AuthorizeModuleAttribute : ActionFilterAttribute, IAsyncAuthorizationFilter
    {
        private readonly string[] _requiredModules;
        public PermissionAction Action { get; set; } = PermissionAction.None;

        public AuthorizeModuleAttribute(params string[] requiredModules)
        {
            _requiredModules = requiredModules ?? Array.Empty<string>();
        }

        public AuthorizeModuleAttribute(PermissionAction action, params string[] requiredModules)
        {
            Action = action;
            _requiredModules = requiredModules ?? Array.Empty<string>();
        }

        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            // 1. AllowAnonymous bypass check
            if (context.Filters.Any(item => item is IAllowAnonymousFilter) ||
                context.ActionDescriptor.EndpointMetadata.Any(em => em is IAllowAnonymous))
            {
                return;
            }

            // 2. Authenticate the request strictly via JWT
            var httpContext = context.HttpContext;
            var user = httpContext.User;

            if (user?.Identity?.IsAuthenticated != true)
            {
                // Attempt direct cryptographic Bearer token validation if middleware hasn't run yet
                var authHeader = httpContext.Request.Headers["Authorization"].ToString();
                if (!string.IsNullOrWhiteSpace(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    var tokenString = authHeader.Substring("Bearer ".Length).Trim();
                    var validatedPrincipal = ValidateJwtToken(tokenString, httpContext.RequestServices);
                    if (validatedPrincipal != null)
                    {
                        httpContext.User = validatedPrincipal;
                        user = validatedPrincipal;
                    }
                }
            }

            // If still not authenticated, reject immediately with 401 Unauthorized
            if (user?.Identity?.IsAuthenticated != true)
            {
                context.Result = new ObjectResult(new
                {
                    success = false,
                    message = "Authentication required. Please provide a valid Bearer token."
                })
                {
                    StatusCode = StatusCodes.Status401Unauthorized
                };
                return;
            }

            // 3. Admin user check: SuperAdmin, Admin, Administrator have unrestricted administrative access
            var role = user.FindFirst(ClaimTypes.Role)?.Value
                    ?? user.FindFirst("role")?.Value;

            if (!string.IsNullOrWhiteSpace(role) &&
                (role.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase) ||
                 role.Equals("Admin", StringComparison.OrdinalIgnoreCase) ||
                 role.Equals("Administrator", StringComparison.OrdinalIgnoreCase)))
            {
                return; // Access granted
            }

            // 4. Determine the required CRUD action
            var requiredAction = Action != PermissionAction.None
                ? Action
                : InferActionFromRequest(httpContext.Request);

            // 5. If no specific modules are required, any authenticated staff member is permitted
            if (_requiredModules.Length == 0)
            {
                return;
            }

            // 6. Resolve permissions for Staff / Manager
            var email = user.FindFirst(ClaimTypes.Email)?.Value
                     ?? user.FindFirst("email")?.Value
                     ?? user.Identity?.Name;

            var dbContext = httpContext.RequestServices.GetService<ApplicationDbContext>();
            var permissionsClaim = user.FindFirst("permissions")?.Value;

            bool isAuthorized = await CheckModuleActionAccessAsync(
                _requiredModules,
                requiredAction,
                permissionsClaim,
                email,
                role,
                dbContext);

            if (!isAuthorized)
            {
                context.Result = new ObjectResult(new
                {
                    success = false,
                    message = $"Access denied. Staff role '{role ?? "Staff"}' lacks required permission ({requiredAction}) for module: '{string.Join(", ", _requiredModules)}'."
                })
                {
                    StatusCode = StatusCodes.Status403Forbidden
                };
                return;
            }
        }

        private static ClaimsPrincipal? ValidateJwtToken(string token, IServiceProvider services)
        {
            try
            {
                var config = services.GetService<IConfiguration>();
                var keyStr = config?["Jwt:Key"] ?? "Honeywell2026@JWTSecretKey#1234567890";
                var issuer = config?["Jwt:Issuer"] ?? "Honeywell";
                var audience = config?["Jwt:Audience"] ?? "HoneywellUsers";

                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(keyStr);

                var validationParams = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = issuer,
                    ValidAudience = audience,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ClockSkew = TimeSpan.Zero
                };

                return tokenHandler.ValidateToken(token, validationParams, out _);
            }
            catch
            {
                return null;
            }
        }

        private static PermissionAction InferActionFromRequest(HttpRequest request)
        {
            var method = request.Method.ToUpperInvariant();
            var path = request.Path.Value?.ToLowerInvariant() ?? "";

            switch (method)
            {
                case "GET":
                case "HEAD":
                    return PermissionAction.View;

                case "DELETE":
                    return PermissionAction.Delete;

                case "PUT":
                case "PATCH":
                    return PermissionAction.Edit;

                case "POST":
                    if (path.Contains("/delete") || path.EndsWith("/delete"))
                    {
                        return PermissionAction.Delete;
                    }
                    return PermissionAction.Add;

                default:
                    return PermissionAction.View;
            }
        }

        private static async Task<bool> CheckModuleActionAccessAsync(
            string[] requiredModules,
            PermissionAction requiredAction,
            string? permissionsClaim,
            string? email,
            string? role,
            ApplicationDbContext? db)
        {
            // Collect all permission descriptors for the user
            var descriptors = new List<ModulePermissionDescriptor>();

            // 1. Parse permissions claim from JWT if available
            if (!string.IsNullOrWhiteSpace(permissionsClaim))
            {
                ParsePermissionsJsonIntoDescriptors(permissionsClaim, descriptors);
            }

            // 2. If descriptors are empty, query the live database for this authenticated staff user
            if (descriptors.Count == 0 && db != null && !string.IsNullOrWhiteSpace(email))
            {
                var cleanEmail = email.Trim().ToLowerInvariant();
                var staffEntity = await db.Staff.AsNoTracking().FirstOrDefaultAsync(s =>
                    s.Email.ToLower() == cleanEmail ||
                    s.EmployeeId.ToLower() == cleanEmail);

                if (staffEntity != null)
                {
                    if (!staffEntity.IsActive) return false;

                    if (staffEntity.PermissionsJson == null)
                    {
                        // Unconfigured permissions: seed role defaults
                        var roleKey = (staffEntity.Role ?? "staff").Trim().ToLowerInvariant();
                        if (StaffController.RoleDefaultPermissions.TryGetValue(roleKey, out var defs))
                        {
                            foreach (var p in defs)
                            {
                                descriptors.Add(new ModulePermissionDescriptor
                                {
                                    ModuleName = p.Trim().ToLowerInvariant(),
                                    CanView = true,
                                    CanAdd = true,
                                    CanEdit = true,
                                    CanDelete = true
                                });
                            }
                        }
                    }
                    else
                    {
                        ParsePermissionsJsonIntoDescriptors(staffEntity.PermissionsJson, descriptors);
                    }
                }
            }

            // 3. Match requiredModules with descriptors, considering module aliases and action flags
            foreach (var req in requiredModules)
            {
                var reqNorm = req.Trim().ToLowerInvariant();
                var aliases = GetModuleAliases(reqNorm);

                foreach (var alias in aliases)
                {
                    var matched = descriptors.Where(d => d.ModuleName.Equals(alias, StringComparison.OrdinalIgnoreCase)).ToList();
                    foreach (var desc in matched)
                    {
                        if (desc.Allows(requiredAction))
                        {
                            return true;
                        }
                    }
                }
            }

            return false;
        }

        private static void ParsePermissionsJsonIntoDescriptors(string json, List<ModulePermissionDescriptor> descriptors)
        {
            if (string.IsNullOrWhiteSpace(json)) return;

            try
            {
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                if (root.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in root.EnumerateArray())
                    {
                        if (item.ValueKind == JsonValueKind.String)
                        {
                            ParseStringPermission(item.GetString(), descriptors);
                        }
                        else if (item.ValueKind == JsonValueKind.Object)
                        {
                            ParseObjectPermission(item, descriptors);
                        }
                    }
                }
                else if (root.ValueKind == JsonValueKind.Object)
                {
                    // Check if it has a nested array (e.g. { "permissions": [...] } or { "staffPermissions": [...] })
                    foreach (var prop in root.EnumerateObject())
                    {
                        if (prop.Value.ValueKind == JsonValueKind.Array)
                        {
                            foreach (var item in prop.Value.EnumerateArray())
                            {
                                if (item.ValueKind == JsonValueKind.String)
                                    ParseStringPermission(item.GetString(), descriptors);
                                else if (item.ValueKind == JsonValueKind.Object)
                                    ParseObjectPermission(item, descriptors);
                            }
                        }
                        else if (prop.Value.ValueKind == JsonValueKind.Object)
                        {
                            // Map format: { "catalog": { "canView": true, "canAdd": false } }
                            var modName = prop.Name;
                            ParseObjectPermission(prop.Value, descriptors, modName);
                        }
                        else if (prop.Value.ValueKind == JsonValueKind.True)
                        {
                            // Boolean format: { "catalog": true }
                            ParseStringPermission(prop.Name, descriptors);
                        }
                    }
                }
            }
            catch
            {
                // Unparseable JSON - ignored
            }
        }

        private static void ParseStringPermission(string? raw, List<ModulePermissionDescriptor> descriptors)
        {
            if (string.IsNullOrWhiteSpace(raw)) return;

            var clean = raw.Trim().ToLowerInvariant();

            // Check for action delimiters: e.g. "catalog:view", "catalog:add", "catalog_edit", "catalog.delete"
            string mod = clean;
            string? act = null;

            if (clean.Contains(':'))
            {
                var parts = clean.Split(':', 2);
                mod = parts[0].Trim();
                act = parts[1].Trim();
            }
            else if (clean.Contains('.'))
            {
                var parts = clean.Split('.', 2);
                mod = parts[0].Trim();
                act = parts[1].Trim();
            }
            else if (clean.EndsWith("_view") || clean.EndsWith("_add") || clean.EndsWith("_edit") || clean.EndsWith("_delete") || clean.EndsWith("_read") || clean.EndsWith("_create") || clean.EndsWith("_update"))
            {
                var lastIdx = clean.LastIndexOf('_');
                mod = clean.Substring(0, lastIdx).Trim();
                act = clean.Substring(lastIdx + 1).Trim();
            }

            var existing = descriptors.FirstOrDefault(d => d.ModuleName.Equals(mod, StringComparison.OrdinalIgnoreCase));
            if (existing == null)
            {
                existing = new ModulePermissionDescriptor { ModuleName = mod };
                descriptors.Add(existing);
            }

            if (string.IsNullOrWhiteSpace(act))
            {
                // Full coarse module access granted
                existing.CanView = true;
                existing.CanAdd = true;
                existing.CanEdit = true;
                existing.CanDelete = true;
            }
            else
            {
                switch (act)
                {
                    case "view":
                    case "read":
                    case "get":
                        existing.CanView = true;
                        break;
                    case "add":
                    case "create":
                    case "post":
                        existing.CanAdd = true;
                        break;
                    case "edit":
                    case "update":
                    case "put":
                    case "patch":
                        existing.CanEdit = true;
                        break;
                    case "delete":
                    case "remove":
                        existing.CanDelete = true;
                        break;
                }
            }
        }

        private static void ParseObjectPermission(JsonElement elem, List<ModulePermissionDescriptor> descriptors, string? defaultModName = null)
        {
            string? modName = defaultModName;

            if (elem.TryGetProperty("moduleName", out var mn) || elem.TryGetProperty("ModuleName", out mn) || elem.TryGetProperty("name", out mn))
            {
                modName = mn.GetString();
            }

            if (string.IsNullOrWhiteSpace(modName)) return;

            var cleanMod = modName.Trim().ToLowerInvariant();
            var desc = descriptors.FirstOrDefault(d => d.ModuleName.Equals(cleanMod, StringComparison.OrdinalIgnoreCase));
            if (desc == null)
            {
                desc = new ModulePermissionDescriptor { ModuleName = cleanMod };
                descriptors.Add(desc);
            }

            bool hasExplicitFlags = false;

            if (elem.TryGetProperty("canView", out var cv) || elem.TryGetProperty("CanView", out cv))
            {
                desc.CanView = cv.ValueKind == JsonValueKind.True;
                hasExplicitFlags = true;
            }
            if (elem.TryGetProperty("canAdd", out var ca) || elem.TryGetProperty("CanAdd", out ca))
            {
                desc.CanAdd = ca.ValueKind == JsonValueKind.True;
                hasExplicitFlags = true;
            }
            if (elem.TryGetProperty("canEdit", out var ce) || elem.TryGetProperty("CanEdit", out ce))
            {
                desc.CanEdit = ce.ValueKind == JsonValueKind.True;
                hasExplicitFlags = true;
            }
            if (elem.TryGetProperty("canDelete", out var cd) || elem.TryGetProperty("CanDelete", out cd))
            {
                desc.CanDelete = cd.ValueKind == JsonValueKind.True;
                hasExplicitFlags = true;
            }

            if (!hasExplicitFlags)
            {
                // Fallback to isAllowed flag
                bool isAllowed = true;
                if (elem.TryGetProperty("isAllowed", out var ia) || elem.TryGetProperty("IsAllowed", out ia))
                {
                    isAllowed = ia.ValueKind == JsonValueKind.True;
                }

                if (isAllowed)
                {
                    desc.CanView = true;
                    desc.CanAdd = true;
                    desc.CanEdit = true;
                    desc.CanDelete = true;
                }
            }
        }

        private static HashSet<string> GetModuleAliases(string module)
        {
            var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { module };

            switch (module)
            {
                case "catalog":
                    set.Add("products");
                    set.Add("categories");
                    set.Add("subcategories");
                    set.Add("brands");
                    break;
                case "products":
                    set.Add("catalog");
                    break;
                case "categories":
                case "subcategories":
                case "brands":
                    set.Add("catalog");
                    break;
                case "inventory":
                    set.Add("stockupdates");
                    set.Add("stock");
                    set.Add("warehouse");
                    break;
                case "stockupdates":
                    set.Add("inventory");
                    set.Add("stock");
                    break;
                case "orders":
                    set.Add("orders & sales");
                    set.Add("sales");
                    break;
                case "staff":
                    set.Add("staff management");
                    set.Add("users");
                    set.Add("team");
                    break;
            }

            return set;
        }

        private class ModulePermissionDescriptor
        {
            public string ModuleName { get; set; } = string.Empty;
            public bool CanView { get; set; }
            public bool CanAdd { get; set; }
            public bool CanEdit { get; set; }
            public bool CanDelete { get; set; }

            public bool Allows(PermissionAction action)
            {
                return action switch
                {
                    PermissionAction.View => CanView,
                    PermissionAction.Add => CanAdd,
                    PermissionAction.Edit => CanEdit,
                    PermissionAction.Delete => CanDelete,
                    PermissionAction.All => CanView && CanAdd && CanEdit && CanDelete,
                    _ => false
                };
            }
        }
    }
}
