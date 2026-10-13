using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Honeywell.Data;
using Honeywell.Models;
using Honeywell.Services.Interfaces;

namespace Honeywell.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StaffController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IJwtService _jwtService;

        private static readonly Dictionary<string, List<string>> RoleDefaultPermissions = new(StringComparer.OrdinalIgnoreCase)
        {
            ["admin"] = new List<string>
            {
                "dashboard", "catalog", "customers", "staff", "reports", "growth journey",
                "tickets", "enquiries", "contact form", "bulk quotes", "partner applications",
                "dealers & distributors", "orders", "orders & sales", "invoices", "stockupdates",
                "marketing", "brands", "blogs", "testimonials", "settings", "suppliers",
                "payment settings", "coins converter", "call history"
            },
            ["manager"] = new List<string>
            {
                "dashboard", "catalog", "customers", "staff", "reports", "growth journey",
                "tickets", "enquiries", "orders", "orders & sales", "invoices", "stockupdates",
                "marketing", "suppliers"
            },
            ["sales"] = new List<string>
            {
                "dashboard", "catalog", "orders", "orders & sales", "invoices", "customers",
                "marketing", "enquiries", "bulk quotes"
            },
            ["inventory"] = new List<string>
            {
                "dashboard", "catalog", "stockupdates", "suppliers"
            },
            ["advisory"] = new List<string>
            {
                "dashboard", "customers", "call history", "reports", "tickets", "enquiries"
            },
            ["staff"] = new List<string>
            {
                "dashboard"
            }
        };

        public StaffController(ApplicationDbContext context, IJwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }

        private static void NormalizeStaffEntity(Staff s)
        {
            if (string.IsNullOrWhiteSpace(s.EmployeeId) && s.Id > 0)
            {
                s.EmployeeId = $"EMP-{s.Id:D4}";
            }

            if (string.IsNullOrWhiteSpace(s.Name))
            {
                s.Name = $"{s.FirstName} {s.LastName}".Trim();
            }
            else if (string.IsNullOrWhiteSpace(s.FirstName))
            {
                var parts = s.Name.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
                s.FirstName = parts.Length > 0 ? parts[0] : "";
                s.LastName = parts.Length > 1 ? string.Join(" ", parts.Skip(1)) : "";
            }

            if (string.IsNullOrWhiteSpace(s.Phone) && !string.IsNullOrWhiteSpace(s.MobileNumber))
            {
                s.Phone = s.MobileNumber;
            }
            else if (string.IsNullOrWhiteSpace(s.MobileNumber) && !string.IsNullOrWhiteSpace(s.Phone))
            {
                s.MobileNumber = s.Phone;
            }

            if (string.IsNullOrWhiteSpace(s.Department))
            {
                s.Department = GetDefaultDepartmentForRole(s.Role);
            }

            if (string.IsNullOrWhiteSpace(s.Status))
            {
                s.Status = s.IsActive ? "Active" : "Inactive";
            }
            else
            {
                s.IsActive = s.Status.Equals("Active", StringComparison.OrdinalIgnoreCase);
            }

            if (s.Permissions == null || s.Permissions.Count == 0)
            {
                var roleKey = (s.Role ?? "staff").Trim().ToLowerInvariant();
                s.Permissions = RoleDefaultPermissions.TryGetValue(roleKey, out var defaults)
                    ? new List<string>(defaults)
                    : new List<string>(RoleDefaultPermissions["staff"]);
            }
        }

        private static string GetDefaultDepartmentForRole(string? role)
        {
            return (role ?? "").Trim().ToLowerInvariant() switch
            {
                "admin" => "Administration",
                "manager" => "Management & Operations",
                "sales" => "Sales & Marketing",
                "inventory" => "Inventory & Warehouse",
                "advisory" => "Customer Advisory",
                _ => "General Operations"
            };
        }

        private async Task SyncStaffToAdminUserAsync(Staff staff)
        {
            if (string.IsNullOrWhiteSpace(staff.Email)) return;

            var cleanEmail = staff.Email.Trim().ToLowerInvariant();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == cleanEmail);

            if (user == null)
            {
                user = new User
                {
                    Email = cleanEmail,
                    Password = string.IsNullOrWhiteSpace(staff.Password) ? "StaffPass@2026!" : staff.Password,
                    Role = string.IsNullOrWhiteSpace(staff.Role) ? "Staff" : staff.Role,
                    FullName = staff.Name,
                    MobileNumber = staff.Phone,
                    EmployeeId = staff.EmployeeId,
                    IsActive = staff.IsActive,
                    CreatedDate = DateTime.UtcNow,
                    PermissionsJson = staff.PermissionsJson
                };
                _context.Users.Add(user);
            }
            else
            {
                if (!string.IsNullOrWhiteSpace(staff.Password))
                    user.Password = staff.Password;
                if (!string.IsNullOrWhiteSpace(staff.Role))
                    user.Role = staff.Role;
                if (!string.IsNullOrWhiteSpace(staff.Name))
                    user.FullName = staff.Name;
                if (!string.IsNullOrWhiteSpace(staff.Phone))
                    user.MobileNumber = staff.Phone;
                if (!string.IsNullOrWhiteSpace(staff.EmployeeId))
                    user.EmployeeId = staff.EmployeeId;
                user.IsActive = staff.IsActive;
                if (!string.IsNullOrWhiteSpace(staff.PermissionsJson))
                    user.PermissionsJson = staff.PermissionsJson;
            }
        }

        private static bool _schemaEnsured = false;

        private async Task EnsureStaffSchemaAsync()
        {
            if (_schemaEnsured) return;
            try
            {
                var conn = _context.Database.GetDbConnection();
                bool wasClosed = conn.State != System.Data.ConnectionState.Open;
                if (wasClosed) await conn.OpenAsync();
                try
                {
                    var existingCols = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                    using (var colCmd = conn.CreateCommand())
                    {
                        colCmd.CommandText = "SHOW COLUMNS FROM `Staff`;";
                        using var reader = await colCmd.ExecuteReaderAsync();
                        while (await reader.ReadAsync())
                        {
                            existingCols.Add(reader["Field"].ToString()!);
                        }
                    }

                    var colsToAdd = new Dictionary<string, string>
                    {
                        { "EmployeeId", "VARCHAR(100) NOT NULL DEFAULT ''" },
                        { "FirstName", "VARCHAR(100) NOT NULL DEFAULT ''" },
                        { "LastName", "VARCHAR(100) NOT NULL DEFAULT ''" },
                        { "MobileNumber", "VARCHAR(50) NOT NULL DEFAULT ''" },
                        { "Department", "VARCHAR(150) NOT NULL DEFAULT 'General'" },
                        { "Password", "VARCHAR(255) NOT NULL DEFAULT ''" },
                        { "IsActive", "TINYINT(1) NOT NULL DEFAULT 1" },
                        { "PermissionsJson", "TEXT NULL" },
                        { "UpdatedAt", "DATETIME NULL" }
                    };

                    foreach (var kv in colsToAdd)
                    {
                        if (!existingCols.Contains(kv.Key))
                        {
                            using var alterCmd = conn.CreateCommand();
                            alterCmd.CommandText = $"ALTER TABLE `Staff` ADD COLUMN `{kv.Key}` {kv.Value};";
                            await alterCmd.ExecuteNonQueryAsync();
                        }
                    }
                    _schemaEnsured = true;
                }
                finally
                {
                    if (wasClosed && conn.State == System.Data.ConnectionState.Open)
                        await conn.CloseAsync();
                }
            }
            catch { }
        }

        private async Task<Staff?> FindStaffAsync(string id)
        {
            await EnsureStaffSchemaAsync();
            if (string.IsNullOrWhiteSpace(id)) return null;
            var clean = Uri.UnescapeDataString(id).Trim();
            if (int.TryParse(clean, out int numericId))
            {
                var byId = await _context.Staff.FindAsync(numericId);
                if (byId != null) return byId;
            }
            var lower = clean.ToLowerInvariant();
            return await _context.Staff.FirstOrDefaultAsync(s =>
                s.EmployeeId.ToLower() == lower ||
                s.Email.ToLower() == lower);
        }

        // 1. GET /api/Staff
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Staff>>> GetAll(
            [FromQuery] string? search = null,
            [FromQuery] string? role = null,
            [FromQuery] string? department = null,
            [FromQuery] string? status = null)
        {
            await EnsureStaffSchemaAsync();
            var list = await _context.Staff
                .OrderByDescending(s => s.Id)
                .ToListAsync();

            foreach (var s in list)
            {
                NormalizeStaffEntity(s);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim().ToLowerInvariant();
                list = list.Where(s =>
                    (s.Name != null && s.Name.ToLowerInvariant().Contains(q)) ||
                    (s.EmployeeId != null && s.EmployeeId.ToLowerInvariant().Contains(q)) ||
                    (s.Email != null && s.Email.ToLowerInvariant().Contains(q)) ||
                    (s.Phone != null && s.Phone.ToLowerInvariant().Contains(q)) ||
                    (s.MobileNumber != null && s.MobileNumber.ToLowerInvariant().Contains(q))
                ).ToList();
            }

            if (!string.IsNullOrWhiteSpace(role) && !role.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                list = list.Where(s => string.Equals(s.Role, role.Trim(), StringComparison.OrdinalIgnoreCase)).ToList();
            }

            if (!string.IsNullOrWhiteSpace(department) && !department.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                list = list.Where(s => string.Equals(s.Department, department.Trim(), StringComparison.OrdinalIgnoreCase)).ToList();
            }

            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                list = list.Where(s => string.Equals(s.Status, status.Trim(), StringComparison.OrdinalIgnoreCase)).ToList();
            }

            return Ok(list);
        }

        // 2. GET /api/Staff/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Staff>> GetById(string id)
        {
            if (id.Equals("stats", StringComparison.OrdinalIgnoreCase))
            {
                var statsResult = await GetStats();
                return (ActionResult)statsResult;
            }
            if (id.Equals("roles", StringComparison.OrdinalIgnoreCase))
            {
                var rolesResult = await GetRoles();
                return (ActionResult)rolesResult;
            }
            if (id.Equals("departments", StringComparison.OrdinalIgnoreCase))
            {
                var deptResult = GetDepartments();
                return (ActionResult)deptResult;
            }

            var staff = await FindStaffAsync(id);
            if (staff == null)
            {
                return NotFound(new { success = false, message = "Staff member not found." });
            }

            NormalizeStaffEntity(staff);
            return Ok(staff);
        }

        // 3. POST /api/Staff
        [HttpPost]
        public async Task<ActionResult<Staff>> Create([FromBody] Staff staff)
        {
            await EnsureStaffSchemaAsync();
            if (staff == null)
            {
                return BadRequest(new { success = false, message = "Invalid staff payload." });
            }

            if (string.IsNullOrWhiteSpace(staff.Name))
            {
                staff.Name = $"{staff.FirstName} {staff.LastName}".Trim();
            }

            if (string.IsNullOrWhiteSpace(staff.Name))
            {
                return BadRequest(new { success = false, message = "Staff Name (or FirstName/LastName) is required." });
            }

            if (string.IsNullOrWhiteSpace(staff.FirstName))
            {
                var parts = staff.Name.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
                staff.FirstName = parts.Length > 0 ? parts[0] : "";
                staff.LastName = parts.Length > 1 ? string.Join(" ", parts.Skip(1)) : "";
            }

            if (string.IsNullOrWhiteSpace(staff.Phone) && !string.IsNullOrWhiteSpace(staff.MobileNumber))
                staff.Phone = staff.MobileNumber.Trim();
            if (string.IsNullOrWhiteSpace(staff.MobileNumber) && !string.IsNullOrWhiteSpace(staff.Phone))
                staff.MobileNumber = staff.Phone.Trim();

            if (string.IsNullOrWhiteSpace(staff.Role))
                staff.Role = "staff";

            if (string.IsNullOrWhiteSpace(staff.Department))
                staff.Department = GetDefaultDepartmentForRole(staff.Role);

            if (string.IsNullOrWhiteSpace(staff.Password))
                staff.Password = "StaffPass@2026!";

            if (string.IsNullOrWhiteSpace(staff.Status))
                staff.Status = staff.IsActive ? "Active" : "Inactive";
            else
                staff.IsActive = staff.Status.Equals("Active", StringComparison.OrdinalIgnoreCase);

            if (staff.Permissions == null || staff.Permissions.Count == 0)
            {
                var roleKey = staff.Role.Trim().ToLowerInvariant();
                staff.Permissions = RoleDefaultPermissions.TryGetValue(roleKey, out var defaults)
                    ? new List<string>(defaults)
                    : new List<string>(RoleDefaultPermissions["staff"]);
            }

            staff.DateJoined = DateTime.UtcNow;
            staff.UpdatedAt = DateTime.UtcNow;

            _context.Staff.Add(staff);
            await _context.SaveChangesAsync();

            if (string.IsNullOrWhiteSpace(staff.EmployeeId))
            {
                staff.EmployeeId = $"EMP-{staff.Id:D4}";
                await _context.SaveChangesAsync();
            }

            await SyncStaffToAdminUserAsync(staff);

            var notification = new Notification
            {
                Title = "Staff Added",
                Message = $"{staff.Name} ({staff.EmployeeId}) has been registered as {staff.Role}.",
                Type = "StaffAdded"
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = staff.Id }, staff);
        }

        // 4. PUT /api/Staff/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] Staff updateData)
        {
            var staff = await FindStaffAsync(id);
            if (staff == null)
            {
                return NotFound(new { success = false, message = "Staff member not found." });
            }

            if (!string.IsNullOrWhiteSpace(updateData.EmployeeId))
                staff.EmployeeId = updateData.EmployeeId.Trim();

            if (!string.IsNullOrWhiteSpace(updateData.FirstName))
                staff.FirstName = updateData.FirstName.Trim();

            if (!string.IsNullOrWhiteSpace(updateData.LastName))
                staff.LastName = updateData.LastName.Trim();

            if (!string.IsNullOrWhiteSpace(updateData.Name))
                staff.Name = updateData.Name.Trim();
            else if (!string.IsNullOrWhiteSpace(updateData.FirstName) || !string.IsNullOrWhiteSpace(updateData.LastName))
                staff.Name = $"{staff.FirstName} {staff.LastName}".Trim();

            if (!string.IsNullOrWhiteSpace(updateData.Email))
                staff.Email = updateData.Email.Trim();

            if (!string.IsNullOrWhiteSpace(updateData.Phone))
            {
                staff.Phone = updateData.Phone.Trim();
                staff.MobileNumber = updateData.Phone.Trim();
            }
            else if (!string.IsNullOrWhiteSpace(updateData.MobileNumber))
            {
                staff.MobileNumber = updateData.MobileNumber.Trim();
                staff.Phone = updateData.MobileNumber.Trim();
            }

            if (!string.IsNullOrWhiteSpace(updateData.Role))
                staff.Role = updateData.Role.Trim();

            if (!string.IsNullOrWhiteSpace(updateData.Department))
                staff.Department = updateData.Department.Trim();

            if (!string.IsNullOrWhiteSpace(updateData.Password))
                staff.Password = updateData.Password;

            if (!string.IsNullOrWhiteSpace(updateData.Status))
            {
                staff.Status = updateData.Status.Trim();
                staff.IsActive = staff.Status.Equals("Active", StringComparison.OrdinalIgnoreCase);
            }
            else
            {
                staff.IsActive = updateData.IsActive;
                staff.Status = staff.IsActive ? "Active" : "Inactive";
            }

            if (updateData.Permissions != null && updateData.Permissions.Count > 0)
            {
                staff.Permissions = updateData.Permissions;
            }

            staff.UpdatedAt = DateTime.UtcNow;

            await SyncStaffToAdminUserAsync(staff);
            await _context.SaveChangesAsync();

            NormalizeStaffEntity(staff);
            return Ok(staff);
        }

        // 5. PATCH /api/Staff/{id}/status
        [HttpPatch("{id}/status")]
        [HttpPut("{id}/status")]
        [HttpPost("{id}/status")]
        public async Task<IActionResult> UpdateStatus(string id, [FromBody] StaffStatusPatchDto? dto)
        {
            var staff = await FindStaffAsync(id);
            if (staff == null)
            {
                return NotFound(new { success = false, message = "Staff member not found." });
            }

            if (dto != null && !string.IsNullOrWhiteSpace(dto.Status))
            {
                staff.Status = dto.Status.Trim();
                staff.IsActive = staff.Status.Equals("Active", StringComparison.OrdinalIgnoreCase);
            }
            else if (dto != null && dto.IsActive.HasValue)
            {
                staff.IsActive = dto.IsActive.Value;
                staff.Status = staff.IsActive ? "Active" : "Inactive";
            }
            else
            {
                // Toggle if no explicit value passed
                staff.IsActive = !staff.IsActive;
                staff.Status = staff.IsActive ? "Active" : "Inactive";
            }

            staff.UpdatedAt = DateTime.UtcNow;
            await SyncStaffToAdminUserAsync(staff);
            await _context.SaveChangesAsync();

            NormalizeStaffEntity(staff);
            return Ok(new
            {
                success = true,
                message = $"Staff status updated to {staff.Status}.",
                id = staff.Id,
                employeeId = staff.EmployeeId,
                status = staff.Status,
                isActive = staff.IsActive,
                data = staff
            });
        }

        // 6. DELETE /api/Staff/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var staff = await FindStaffAsync(id);
            if (staff == null)
            {
                return NotFound(new { success = false, message = "Staff member not found." });
            }

            var deletedId = staff.Id;
            _context.Staff.Remove(staff);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Staff member deleted successfully.", id = deletedId });
        }

        // 7. GET /api/Staff/stats
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            await EnsureStaffSchemaAsync();
            var list = await _context.Staff.ToListAsync();
            foreach (var s in list)
            {
                NormalizeStaffEntity(s);
            }

            int totalStaff = list.Count;
            int activeMembers = list.Count(s => s.IsActive || string.Equals(s.Status, "Active", StringComparison.OrdinalIgnoreCase));
            int inactiveMembers = totalStaff - activeMembers;
            int adminAccounts = list.Count(s => string.Equals(s.Role, "admin", StringComparison.OrdinalIgnoreCase));

            var roleBreakdown = list
                .GroupBy(s => (s.Role ?? "staff").ToLowerInvariant())
                .ToDictionary(g => g.Key, g => g.Count());

            var departmentBreakdown = list
                .GroupBy(s => string.IsNullOrWhiteSpace(s.Department) ? "General Operations" : s.Department)
                .ToDictionary(g => g.Key, g => g.Count());

            return Ok(new
            {
                totalStaff,
                activeMembers,
                inactiveMembers,
                onLeave = list.Count(s => string.Equals(s.Status, "On Leave", StringComparison.OrdinalIgnoreCase)),
                adminAccounts,
                roleBreakdown,
                departmentBreakdown
            });
        }

        // 8. GET /api/Staff/roles
        [HttpGet("roles")]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await RolesStoreHelper.GetStoredRolesAsync(_context, RoleDefaultPermissions);
            var formatted = roles.Select(r => new
            {
                id = r.Code,
                roleId = r.Id,
                code = r.Code,
                name = r.Name,
                label = r.Label,
                description = r.Description,
                defaultDepartment = r.DefaultDepartment,
                isSystemRole = r.IsSystemRole,
                defaultPermissions = r.Permissions,
                permissions = r.Permissions
            });
            return Ok(formatted);
        }

        // 9. GET /api/Staff/departments
        [HttpGet("departments")]
        public IActionResult GetDepartments()
        {
            var departments = new[]
            {
                new { id = "administration", name = "Administration", code = "DEPT-ADM" },
                new { id = "management", name = "Management & Operations", code = "DEPT-MGT" },
                new { id = "sales", name = "Sales & Marketing", code = "DEPT-SLS" },
                new { id = "inventory", name = "Inventory & Warehouse", code = "DEPT-INV" },
                new { id = "advisory", name = "Customer Advisory", code = "DEPT-ADV" },
                new { id = "procurement", name = "Procurement & Suppliers", code = "DEPT-PRC" },
                new { id = "support", name = "Support & Service", code = "DEPT-SUP" },
                new { id = "general", name = "General Operations", code = "DEPT-GEN" }
            };

            return Ok(departments);
        }

        // 10. POST /api/Staff/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] StaffLoginRequestDto dto)
        {
            await EnsureStaffSchemaAsync();
            if (dto == null || (string.IsNullOrWhiteSpace(dto.Email) && string.IsNullOrWhiteSpace(dto.EmployeeId)) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { success = false, message = "Email (or Employee ID) and Password are required." });
            }

            var identifier = (!string.IsNullOrWhiteSpace(dto.Email) ? dto.Email : dto.EmployeeId)!.Trim().ToLowerInvariant();

            var staff = await _context.Staff.FirstOrDefaultAsync(s =>
                s.Email.ToLower() == identifier ||
                s.EmployeeId.ToLower() == identifier);

            if (staff == null)
            {
                // Fallback check in admin_user table
                var adminUser = await _context.Users.FirstOrDefaultAsync(u =>
                    u.Email.ToLower() == identifier ||
                    (u.EmployeeId != null && u.EmployeeId.ToLower() == identifier));

                if (adminUser == null || adminUser.Password != dto.Password)
                {
                    return Unauthorized(new { success = false, message = "Invalid email/employee ID or password." });
                }

                if (!adminUser.IsActive)
                {
                    return StatusCode(403, new { success = false, message = "Account is inactive. Please contact an administrator." });
                }

                var adminToken = _jwtService.GenerateToken(adminUser);
                var adminPerms = !string.IsNullOrWhiteSpace(adminUser.PermissionsJson)
                    ? PermissionsPayloadParser.ParsePermissionsJson(adminUser.PermissionsJson) ?? RoleDefaultPermissions["admin"]
                    : RoleDefaultPermissions["admin"];

                return Ok(new
                {
                    success = true,
                    message = "Staff login successful.",
                    token = adminToken,
                    staff = new
                    {
                        id = 0,
                        employeeId = string.IsNullOrWhiteSpace(adminUser.EmployeeId) ? "EMP-0001" : adminUser.EmployeeId,
                        name = adminUser.FullName ?? adminUser.Email.Split('@')[0],
                        firstName = (adminUser.FullName ?? "Admin").Split(' ')[0],
                        lastName = "",
                        email = adminUser.Email,
                        phone = adminUser.MobileNumber ?? "",
                        mobileNumber = adminUser.MobileNumber ?? "",
                        role = (adminUser.Role ?? "admin").ToLowerInvariant(),
                        department = "Administration",
                        status = adminUser.IsActive ? "Active" : "Inactive",
                        isActive = adminUser.IsActive,
                        permissions = adminPerms
                    }
                });
            }

            if (!string.IsNullOrWhiteSpace(staff.Password) && staff.Password != dto.Password)
            {
                return Unauthorized(new { success = false, message = "Invalid email/employee ID or password." });
            }

            NormalizeStaffEntity(staff);

            if (!staff.IsActive)
            {
                return StatusCode(403, new { success = false, message = "Staff account is inactive. Please contact an administrator." });
            }

            var tokenUser = new User
            {
                Email = string.IsNullOrWhiteSpace(staff.Email) ? staff.EmployeeId : staff.Email,
                Role = string.IsNullOrWhiteSpace(staff.Role) ? "Staff" : staff.Role,
                FullName = staff.Name,
                EmployeeId = staff.EmployeeId,
                MobileNumber = string.IsNullOrWhiteSpace(staff.MobileNumber) ? staff.Phone : staff.MobileNumber,
                IsActive = staff.IsActive
            };
            var jwtToken = _jwtService.GenerateToken(tokenUser);

            return Ok(new
            {
                success = true,
                message = "Staff login successful.",
                token = jwtToken,
                staff = staff
            });
        }

        // 1. GET /api/Permissions/modules (under Staff in Swagger)
        [HttpGet("/api/Permissions/modules")]
        public async Task<IActionResult> GetPermissionModules()
        {
            var modules = await ModulesStoreHelper.GetStoredModulesAsync(_context);
            return Ok(modules);
        }

        [HttpPost("/api/Permissions/modules")]
        public async Task<IActionResult> CreatePermissionModule([FromBody] StaffModuleItem item)
        {
            if (item == null || string.IsNullOrWhiteSpace(item.ModuleName))
                return BadRequest(new { message = "ModuleName is required." });

            var modules = await ModulesStoreHelper.GetStoredModulesAsync(_context);
            var cleanName = item.ModuleName.Trim().ToLowerInvariant();
            var existing = modules.FirstOrDefault(m => m.ModuleName.Equals(cleanName, StringComparison.OrdinalIgnoreCase));
            if (existing != null)
                return Ok(existing);

            var nextId = modules.Count > 0 ? modules.Max(m => m.Id) + 1 : 1;
            var newMod = new StaffModuleItem
            {
                Id = nextId,
                ModuleName = cleanName,
                Description = item.Description ?? $"Custom {cleanName} module",
                DisplayOrder = item.DisplayOrder > 0 ? item.DisplayOrder : modules.Count
            };
            modules.Add(newMod);
            await ModulesStoreHelper.SaveStoredModulesAsync(_context, modules);
            return Ok(newMod);
        }

        [HttpDelete("/api/Permissions/modules/{id:int}")]
        public async Task<IActionResult> DeletePermissionModule(int id)
        {
            var modules = await ModulesStoreHelper.GetStoredModulesAsync(_context);
            var target = modules.FirstOrDefault(m => m.Id == id);
            if (target == null)
                return NotFound(new { message = "Module not found." });

            modules.Remove(target);
            await ModulesStoreHelper.SaveStoredModulesAsync(_context, modules);
            return Ok(new { success = true, message = "Module removed." });
        }

        // 2. GET /api/Staff/{id}/permissions
        [HttpGet("{id}/permissions")]
        public async Task<IActionResult> GetStaffPermissions(string id)
        {
            var staff = await FindStaffAsync(id);
            if (staff == null)
            {
                return NotFound(new { success = false, message = "Staff member not found." });
            }

            NormalizeStaffEntity(staff);
            var allModules = await ModulesStoreHelper.GetStoredModulesAsync(_context);
            var assignedSet = new HashSet<string>(staff.Permissions ?? new List<string>(), StringComparer.OrdinalIgnoreCase);

            var modulePermissions = allModules.Select(m => new
            {
                moduleId = m.Id,
                moduleName = m.ModuleName,
                description = m.Description,
                isAllowed = assignedSet.Contains(m.ModuleName),
                canView = assignedSet.Contains(m.ModuleName),
                canAdd = assignedSet.Contains(m.ModuleName),
                canEdit = assignedSet.Contains(m.ModuleName),
                canDelete = assignedSet.Contains(m.ModuleName)
            }).ToList();

            return Ok(new
            {
                staffId = staff.Id,
                employeeId = staff.EmployeeId,
                name = staff.Name,
                email = staff.Email,
                role = staff.Role,
                permissions = staff.Permissions,
                modulePermissions
            });
        }

        // 3. PUT /api/Staff/{id}/permissions
        [HttpPut("{id}/permissions")]
        public async Task<IActionResult> UpdateStaffPermissions(string id, [FromBody] StaffPermissionsUpdateDto dto)
        {
            var staff = await FindStaffAsync(id);
            if (staff == null)
            {
                return NotFound(new { success = false, message = "Staff member not found." });
            }

            var allModules = await ModulesStoreHelper.GetStoredModulesAsync(_context);
            var parsedPermissions = PermissionsPayloadParser.ExtractFromDto(dto, allModules);

            staff.Permissions = parsedPermissions;
            staff.UpdatedAt = DateTime.UtcNow;

            await SyncStaffToAdminUserAsync(staff);
            await _context.SaveChangesAsync();

            NormalizeStaffEntity(staff);

            return Ok(new
            {
                success = true,
                message = "Staff module permissions updated successfully.",
                staffId = staff.Id,
                employeeId = staff.EmployeeId,
                role = staff.Role,
                permissions = staff.Permissions
            });
        }

        // 3b. POST /api/Staff/{id}/permissions
        [HttpPost("{id}/permissions")]
        [HttpPatch("{id}/permissions")]
        public async Task<IActionResult> CreateStaffPermissions(string id, [FromBody] StaffPermissionsUpdateDto dto)
        {
            return await UpdateStaffPermissions(id, dto);
        }

        // 4. GET /api/Auth/me/permissions (under Staff in Swagger)
        [HttpGet("/api/Auth/me/permissions")]
        public async Task<IActionResult> GetMyEffectivePermissions([FromQuery] string? email = null)
        {
            await EnsureStaffSchemaAsync();
            string? resolvedEmail = email;

            if (string.IsNullOrWhiteSpace(resolvedEmail) && User?.Identity?.IsAuthenticated == true)
            {
                resolvedEmail = User.Identity.Name
                    ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                    ?? User.FindFirst("email")?.Value;
            }

            if (string.IsNullOrWhiteSpace(resolvedEmail) && Request.Headers.TryGetValue("X-User-Email", out var headerEmail))
            {
                resolvedEmail = headerEmail.ToString();
            }

            if (string.IsNullOrWhiteSpace(resolvedEmail) && Request.Headers.TryGetValue("Authorization", out var authHeader))
            {
                var raw = authHeader.ToString();
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
                            if (root.TryGetProperty("email", out var em))
                                resolvedEmail = em.GetString();
                            else if (root.TryGetProperty("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name", out var cn))
                                resolvedEmail = cn.GetString();
                            else if (root.TryGetProperty("unique_name", out var un))
                                resolvedEmail = un.GetString();
                        }
                        catch { }
                    }
                }
            }

            var allModules = await ModulesStoreHelper.GetStoredModulesAsync(_context);
            var allRoles = await RolesStoreHelper.GetStoredRolesAsync(_context);
            var cleanIdentifier = (resolvedEmail ?? "").Trim().ToLowerInvariant();

            if (!string.IsNullOrWhiteSpace(cleanIdentifier))
            {
                var staff = await _context.Staff.FirstOrDefaultAsync(s =>
                    s.Email.ToLower() == cleanIdentifier ||
                    s.EmployeeId.ToLower() == cleanIdentifier);

                if (staff != null)
                {
                    NormalizeStaffEntity(staff);
                    var allowedSet = new HashSet<string>(staff.Permissions, StringComparer.OrdinalIgnoreCase);
                    return Ok(new
                    {
                        success = true,
                        staffId = staff.Id,
                        employeeId = staff.EmployeeId,
                        name = staff.Name,
                        email = staff.Email,
                        role = staff.Role,
                        isActive = staff.IsActive,
                        permissions = staff.Permissions,
                        modulePermissions = allModules.Select(m => new
                        {
                            moduleId = m.Id,
                            moduleName = m.ModuleName,
                            isAllowed = allowedSet.Contains(m.ModuleName),
                            canView = allowedSet.Contains(m.ModuleName),
                            canAdd = allowedSet.Contains(m.ModuleName),
                            canEdit = allowedSet.Contains(m.ModuleName),
                            canDelete = allowedSet.Contains(m.ModuleName)
                        }).ToList()
                    });
                }
            }

            var adminUser = !string.IsNullOrWhiteSpace(cleanIdentifier)
                ? await _context.Users.FirstOrDefaultAsync(u =>
                    u.Email.ToLower() == cleanIdentifier ||
                    (u.EmployeeId != null && u.EmployeeId.ToLower() == cleanIdentifier))
                : null;

            adminUser ??= await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == "bhargavakurapati49@gmail.com")
                          ?? await _context.Users.FirstOrDefaultAsync();

            var roleName = adminUser?.Role ?? "SuperAdmin";
            List<string>? effectivePerms = null;

            if (adminUser != null && !string.IsNullOrWhiteSpace(adminUser.PermissionsJson))
            {
                effectivePerms = PermissionsPayloadParser.ParsePermissionsJson(adminUser.PermissionsJson);
            }

            if (effectivePerms == null || effectivePerms.Count == 0)
            {
                if (roleName.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase) ||
                    roleName.Equals("Admin", StringComparison.OrdinalIgnoreCase))
                {
                    effectivePerms = allModules.Select(m => m.ModuleName).ToList();
                }
                else
                {
                    var matchedRole = RolesStoreHelper.FindRole(allRoles, roleName);
                    effectivePerms = matchedRole?.Permissions ?? new List<string> { "dashboard" };
                }
            }

            var adminAllowedSet = new HashSet<string>(effectivePerms, StringComparer.OrdinalIgnoreCase);

            return Ok(new
            {
                success = true,
                employeeId = string.IsNullOrWhiteSpace(adminUser?.EmployeeId) ? "EMP-0001" : adminUser!.EmployeeId,
                name = adminUser?.FullName ?? adminUser?.Email?.Split('@')[0] ?? "Admin",
                email = adminUser?.Email ?? "bhargavakurapati49@gmail.com",
                role = roleName,
                isActive = adminUser?.IsActive ?? true,
                permissions = effectivePerms,
                modulePermissions = allModules.Select(m => new
                {
                    moduleId = m.Id,
                    moduleName = m.ModuleName,
                    isAllowed = adminAllowedSet.Contains(m.ModuleName),
                    canView = adminAllowedSet.Contains(m.ModuleName),
                    canAdd = adminAllowedSet.Contains(m.ModuleName),
                    canEdit = adminAllowedSet.Contains(m.ModuleName),
                    canDelete = adminAllowedSet.Contains(m.ModuleName)
                }).ToList()
            });
        }

        // GET /api/Roles (under Staff in Swagger)
        [HttpGet("/api/Roles")]
        public async Task<IActionResult> GetAllRolesRoot()
        {
            return await GetRoles();
        }

        // GET /api/Roles/{id} (under Staff in Swagger)
        [HttpGet("/api/Roles/{id}")]
        public async Task<IActionResult> GetRoleByIdRoot(string id)
        {
            var roles = await RolesStoreHelper.GetStoredRolesAsync(_context);
            var role = RolesStoreHelper.FindRole(roles, id);
            if (role == null)
                return NotFound(new { success = false, message = $"Role '{id}' not found." });
            return Ok(role);
        }

        // 5. GET /api/Roles/{id}/permissions (under Staff in Swagger)
        [HttpGet("/api/Roles/{id}/permissions")]
        public async Task<IActionResult> GetRolePermissions(string id)
        {
            var roles = await RolesStoreHelper.GetStoredRolesAsync(_context);
            var role = RolesStoreHelper.FindRole(roles, id);
            if (role == null)
                return NotFound(new { success = false, message = $"Role '{id}' not found." });

            var allModules = await ModulesStoreHelper.GetStoredModulesAsync(_context);
            var assignedSet = new HashSet<string>(role.Permissions ?? new List<string>(), StringComparer.OrdinalIgnoreCase);

            var modulePermissions = allModules.Select(m => new
            {
                moduleId = m.Id,
                moduleName = m.ModuleName,
                description = m.Description,
                isAllowed = assignedSet.Contains(m.ModuleName)
            }).ToList();

            return Ok(new
            {
                roleId = role.Id,
                code = role.Code,
                name = role.Name,
                label = role.Label,
                permissions = role.Permissions,
                modulePermissions
            });
        }

        // 6. PUT /api/Roles/{id}/permissions (under Staff in Swagger)
        [HttpPut("/api/Roles/{id}/permissions")]
        public async Task<IActionResult> UpdateRolePermissions(string id, [FromBody] StaffPermissionsUpdateDto dto)
        {
            var roles = await RolesStoreHelper.GetStoredRolesAsync(_context);
            var role = RolesStoreHelper.FindRole(roles, id);
            if (role == null)
                return NotFound(new { success = false, message = $"Role '{id}' not found." });

            var allModules = await ModulesStoreHelper.GetStoredModulesAsync(_context);
            var parsedPermissions = PermissionsPayloadParser.ExtractFromDto(dto, allModules);

            role.Permissions = parsedPermissions;
            await RolesStoreHelper.SaveStoredRolesAsync(_context, roles);

            return Ok(new
            {
                success = true,
                message = $"Permissions for role '{role.Name}' updated successfully.",
                roleId = role.Id,
                code = role.Code,
                name = role.Name,
                permissions = role.Permissions
            });
        }

        // 6b. POST /api/Roles/{id}/permissions (under Staff in Swagger)
        [HttpPost("/api/Roles/{id}/permissions")]
        [HttpPatch("/api/Roles/{id}/permissions")]
        public async Task<IActionResult> CreateRolePermissions(string id, [FromBody] StaffPermissionsUpdateDto dto)
        {
            return await UpdateRolePermissions(id, dto);
        }

        // 7. POST /api/Roles (under Staff in Swagger)
        [HttpPost("/api/Roles")]
        public async Task<IActionResult> CreateRole([FromBody] CreateOrUpdateRoleDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { success = false, message = "Role Name is required." });

            var roles = await RolesStoreHelper.GetStoredRolesAsync(_context);
            var cleanCode = (!string.IsNullOrWhiteSpace(dto.Code) ? dto.Code : dto.Name)
                .Trim().ToLowerInvariant().Replace(" ", "_");

            if (roles.Any(r => r.Code.Equals(cleanCode, StringComparison.OrdinalIgnoreCase) || r.Name.Equals(dto.Name.Trim(), StringComparison.OrdinalIgnoreCase)))
            {
                return Conflict(new { success = false, message = $"Role '{dto.Name}' already exists." });
            }

            var nextId = roles.Count > 0 ? roles.Max(r => r.Id) + 1 : 1;
            var newRole = new StaffRoleItem
            {
                Id = nextId,
                Code = cleanCode,
                Name = dto.Name.Trim(),
                Label = !string.IsNullOrWhiteSpace(dto.Label) ? dto.Label.Trim() : dto.Name.Trim(),
                Description = dto.Description ?? $"{dto.Name.Trim()} role",
                DefaultDepartment = !string.IsNullOrWhiteSpace(dto.DefaultDepartment) ? dto.DefaultDepartment.Trim() : "General Operations",
                IsSystemRole = false,
                Permissions = dto.Permissions ?? dto.DefaultPermissions ?? new List<string> { "dashboard" }
            };

            roles.Add(newRole);
            await RolesStoreHelper.SaveStoredRolesAsync(_context, roles);

            return StatusCode(201, newRole);
        }

        // 8. PUT /api/Roles/{id} (under Staff in Swagger)
        [HttpPut("/api/Roles/{id}")]
        public async Task<IActionResult> UpdateRole(string id, [FromBody] CreateOrUpdateRoleDto dto)
        {
            if (dto == null)
                return BadRequest(new { success = false, message = "Invalid role payload." });

            var roles = await RolesStoreHelper.GetStoredRolesAsync(_context);
            var role = RolesStoreHelper.FindRole(roles, id);
            if (role == null)
                return NotFound(new { success = false, message = $"Role '{id}' not found." });

            if (!string.IsNullOrWhiteSpace(dto.Name))
                role.Name = dto.Name.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Label))
                role.Label = dto.Label.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Code))
                role.Code = dto.Code.Trim().ToLowerInvariant();
            if (dto.Description != null)
                role.Description = dto.Description;
            if (!string.IsNullOrWhiteSpace(dto.DefaultDepartment))
                role.DefaultDepartment = dto.DefaultDepartment.Trim();
            if (dto.Permissions != null)
                role.Permissions = dto.Permissions;
            else if (dto.DefaultPermissions != null)
                role.Permissions = dto.DefaultPermissions;

            await RolesStoreHelper.SaveStoredRolesAsync(_context, roles);

            return Ok(new
            {
                success = true,
                message = $"Role '{role.Name}' updated successfully.",
                role
            });
        }

        // 9. DELETE /api/Roles/{id} (under Staff in Swagger)
        [HttpDelete("/api/Roles/{id}")]
        public async Task<IActionResult> DeleteRole(string id)
        {
            var roles = await RolesStoreHelper.GetStoredRolesAsync(_context);
            var role = RolesStoreHelper.FindRole(roles, id);
            if (role == null)
                return NotFound(new { success = false, message = $"Role '{id}' not found." });

            roles.Remove(role);
            await RolesStoreHelper.SaveStoredRolesAsync(_context, roles);

            return Ok(new
            {
                success = true,
                message = $"Role '{role.Name}' deleted successfully.",
                id = role.Id,
                code = role.Code
            });
        }
    }

    internal static class ModulesStoreHelper
    {
        public const string ConfigKey = "StaffConsoleModules";

        public static readonly List<string> DefaultModules = new()
        {
            "dashboard", "catalog", "customers", "staff", "reports", "growth journey",
            "tickets", "enquiries", "contact form", "bulk quotes", "partner applications",
            "dealers & distributors", "orders", "orders & sales", "invoices", "stockupdates",
            "marketing", "brands", "blogs", "testimonials", "settings", "suppliers",
            "payment settings", "coins converter", "call history"
        };

        public static async Task<List<StaffModuleItem>> GetStoredModulesAsync(ApplicationDbContext context)
        {
            var cfg = await context.SystemConfigs.FirstOrDefaultAsync(c => c.Key == ConfigKey);
            if (cfg != null && !string.IsNullOrWhiteSpace(cfg.JsonValue))
            {
                try
                {
                    var parsed = JsonSerializer.Deserialize<List<StaffModuleItem>>(cfg.JsonValue);
                    if (parsed != null && parsed.Count > 0)
                        return parsed;
                }
                catch { }
            }

            return DefaultModules.Select((name, idx) => new StaffModuleItem
            {
                Id = idx + 1,
                ModuleName = name,
                Description = $"Core {name} module",
                DisplayOrder = idx
            }).ToList();
        }

        public static async Task SaveStoredModulesAsync(ApplicationDbContext context, List<StaffModuleItem> modules)
        {
            var cfg = await context.SystemConfigs.FirstOrDefaultAsync(c => c.Key == ConfigKey);
            var json = JsonSerializer.Serialize(modules);
            if (cfg == null)
            {
                context.SystemConfigs.Add(new SystemConfig
                {
                    Key = ConfigKey,
                    JsonValue = json,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            else
            {
                cfg.JsonValue = json;
                cfg.UpdatedAt = DateTime.UtcNow;
            }
            await context.SaveChangesAsync();
        }
    }

    internal static class RolesStoreHelper
    {
        public const string ConfigKey = "StaffEnterpriseRoles";

        public static async Task<List<StaffRoleItem>> GetStoredRolesAsync(
            ApplicationDbContext context,
            Dictionary<string, List<string>>? roleDefaults = null)
        {
            var cfg = await context.SystemConfigs.FirstOrDefaultAsync(c => c.Key == ConfigKey);
            if (cfg != null && !string.IsNullOrWhiteSpace(cfg.JsonValue))
            {
                try
                {
                    var parsed = JsonSerializer.Deserialize<List<StaffRoleItem>>(cfg.JsonValue);
                    if (parsed != null && parsed.Count > 0)
                        return parsed;
                }
                catch { }
            }

            var initial = new List<StaffRoleItem>
            {
                new()
                {
                    Id = 1,
                    Code = "admin",
                    Name = "Admin",
                    Label = "Admin",
                    Description = "Full administrative access across all enterprise modules.",
                    DefaultDepartment = "Administration",
                    IsSystemRole = true,
                    Permissions = new List<string>
                    {
                        "dashboard", "catalog", "customers", "staff", "reports", "growth journey",
                        "tickets", "enquiries", "contact form", "bulk quotes", "partner applications",
                        "dealers & distributors", "orders", "orders & sales", "invoices", "stockupdates",
                        "marketing", "brands", "blogs", "testimonials", "settings", "suppliers",
                        "payment settings", "coins converter", "call history"
                    }
                },
                new()
                {
                    Id = 2,
                    Code = "advisory",
                    Name = "Advisory",
                    Label = "Advisory",
                    Description = "Customer advisory, call history, tickets, and enquiries management.",
                    DefaultDepartment = "Customer Advisory",
                    IsSystemRole = true,
                    Permissions = new List<string> { "dashboard", "customers", "call history", "reports", "tickets", "enquiries" }
                },
                new()
                {
                    Id = 3,
                    Code = "inventory",
                    Name = "Inventory",
                    Label = "Inventory",
                    Description = "Product catalog, stock updates, and supplier management.",
                    DefaultDepartment = "Inventory & Warehouse",
                    IsSystemRole = true,
                    Permissions = new List<string> { "dashboard", "catalog", "stockupdates", "suppliers" }
                },
                new()
                {
                    Id = 4,
                    Code = "manager",
                    Name = "Manager",
                    Label = "Manager",
                    Description = "Operations, staff supervision, reports, orders, and inventory oversight.",
                    DefaultDepartment = "Management & Operations",
                    IsSystemRole = true,
                    Permissions = new List<string>
                    {
                        "dashboard", "catalog", "customers", "staff", "reports", "growth journey",
                        "tickets", "enquiries", "orders", "orders & sales", "invoices", "stockupdates",
                        "marketing", "suppliers"
                    }
                },
                new()
                {
                    Id = 5,
                    Code = "sales",
                    Name = "Sales",
                    Label = "Sales",
                    Description = "Orders, invoices, bulk quotes, marketing, and customer sales operations.",
                    DefaultDepartment = "Sales & Marketing",
                    IsSystemRole = true,
                    Permissions = new List<string>
                    {
                        "dashboard", "catalog", "orders", "orders & sales", "invoices", "customers",
                        "marketing", "enquiries", "bulk quotes"
                    }
                },
                new()
                {
                    Id = 6,
                    Code = "staff",
                    Name = "Staff",
                    Label = "General Staff",
                    Description = "Standard staff console access.",
                    DefaultDepartment = "General Operations",
                    IsSystemRole = true,
                    Permissions = new List<string> { "dashboard" }
                }
            };

            return initial;
        }

        public static async Task SaveStoredRolesAsync(ApplicationDbContext context, List<StaffRoleItem> roles)
        {
            var cfg = await context.SystemConfigs.FirstOrDefaultAsync(c => c.Key == ConfigKey);
            var json = JsonSerializer.Serialize(roles);
            if (cfg == null)
            {
                context.SystemConfigs.Add(new SystemConfig
                {
                    Key = ConfigKey,
                    JsonValue = json,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            else
            {
                cfg.JsonValue = json;
                cfg.UpdatedAt = DateTime.UtcNow;
            }
            await context.SaveChangesAsync();
        }

        public static StaffRoleItem? FindRole(List<StaffRoleItem> roles, string idOrCode)
        {
            if (string.IsNullOrWhiteSpace(idOrCode)) return null;
            var clean = Uri.UnescapeDataString(idOrCode).Trim();
            if (int.TryParse(clean, out int numericId))
            {
                var byId = roles.FirstOrDefault(r => r.Id == numericId);
                if (byId != null) return byId;
            }
            return roles.FirstOrDefault(r =>
                r.Code.Equals(clean, StringComparison.OrdinalIgnoreCase) ||
                r.Name.Equals(clean, StringComparison.OrdinalIgnoreCase));
        }
    }

    internal static class PermissionsPayloadParser
    {
        public static List<string> ExtractFromDto(StaffPermissionsUpdateDto? dto, List<StaffModuleItem> allModules)
        {
            var result = new List<string>();
            if (dto == null) return result;

            var moduleMap = allModules.ToDictionary(m => m.Id, m => m.ModuleName);
            void AddUnique(string? name)
            {
                if (string.IsNullOrWhiteSpace(name)) return;
                var clean = name.Trim().ToLowerInvariant();
                if (!result.Contains(clean))
                    result.Add(clean);
            }

            if (dto.Permissions != null && dto.Permissions.Count > 0)
            {
                foreach (var p in dto.Permissions) AddUnique(p);
            }
            if (dto.Modules != null && dto.Modules.Count > 0)
            {
                foreach (var m in dto.Modules) AddUnique(m);
            }
            if (dto.ModulePermissions != null && dto.ModulePermissions.Count > 0)
            {
                foreach (var kv in dto.ModulePermissions)
                {
                    if (kv.Value) AddUnique(kv.Key);
                }
            }
            if (dto.StaffPermissions != null && dto.StaffPermissions.Count > 0)
            {
                foreach (var sp in dto.StaffPermissions)
                {
                    if (!(sp.IsAllowed || sp.CanView)) continue;
                    if (!string.IsNullOrWhiteSpace(sp.ModuleName))
                        AddUnique(sp.ModuleName);
                    else if (moduleMap.TryGetValue(sp.ModuleId, out var mappedName))
                        AddUnique(mappedName);
                }
            }
            return result;
        }

        public static List<string>? ParsePermissionsJson(string? json)
        {
            if (string.IsNullOrWhiteSpace(json)) return null;
            try
            {
                using var doc = JsonDocument.Parse(json);
                return ExtractPermissionsList(doc.RootElement, new List<StaffModuleItem>());
            }
            catch
            {
                return null;
            }
        }

        public static List<string> ExtractPermissionsList(JsonElement body, List<StaffModuleItem> allModules)
        {
            var result = new List<string>();
            var moduleMap = allModules.ToDictionary(m => m.Id, m => m.ModuleName);

            void AddUnique(string? name)
            {
                if (string.IsNullOrWhiteSpace(name)) return;
                var clean = name.Trim().ToLowerInvariant();
                if (!result.Contains(clean))
                    result.Add(clean);
            }

            if (body.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in body.EnumerateArray())
                {
                    if (item.ValueKind == JsonValueKind.String)
                    {
                        AddUnique(item.GetString());
                    }
                    else if (item.ValueKind == JsonValueKind.Object)
                    {
                        bool allowed = true;
                        if (item.TryGetProperty("isAllowed", out var ia) || item.TryGetProperty("IsAllowed", out ia))
                            allowed = ia.ValueKind == JsonValueKind.True;
                        else if (item.TryGetProperty("canView", out var cv) || item.TryGetProperty("CanView", out cv))
                            allowed = cv.ValueKind == JsonValueKind.True;

                        if (!allowed) continue;

                        if (item.TryGetProperty("moduleName", out var mn) || item.TryGetProperty("ModuleName", out mn) || item.TryGetProperty("name", out mn))
                        {
                            AddUnique(mn.GetString());
                        }
                        else if ((item.TryGetProperty("moduleId", out var mid) || item.TryGetProperty("ModuleId", out mid)) && mid.TryGetInt32(out int mIdVal))
                        {
                            if (moduleMap.TryGetValue(mIdVal, out var mappedName))
                                AddUnique(mappedName);
                        }
                    }
                }
                return result;
            }

            if (body.ValueKind == JsonValueKind.Object)
            {
                foreach (var propName in new[] { "permissions", "Permissions", "modules", "Modules", "defaultPermissions", "DefaultPermissions" })
                {
                    if (body.TryGetProperty(propName, out var arrProp) && (arrProp.ValueKind == JsonValueKind.Array || arrProp.ValueKind == JsonValueKind.Object))
                    {
                        return ExtractPermissionsList(arrProp, allModules);
                    }
                }

                if (body.TryGetProperty("staffPermissions", out var spProp) || body.TryGetProperty("StaffPermissions", out spProp))
                {
                    if (spProp.ValueKind == JsonValueKind.Array)
                        return ExtractPermissionsList(spProp, allModules);
                }

                if (body.TryGetProperty("modulePermissions", out var mpProp) || body.TryGetProperty("ModulePermissions", out mpProp))
                {
                    if (mpProp.ValueKind == JsonValueKind.Object || mpProp.ValueKind == JsonValueKind.Array)
                        return ExtractPermissionsList(mpProp, allModules);
                }

                foreach (var prop in body.EnumerateObject())
                {
                    if (prop.Value.ValueKind == JsonValueKind.True)
                    {
                        AddUnique(prop.Name);
                    }
                }
            }

            return result;
        }
    }


    // Companion controller for /api/Module called by AddStaff.jsx
    [ApiController]
    [Route("api/[controller]")]
    public class ModuleController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ModuleController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var modules = await ModulesStoreHelper.GetStoredModulesAsync(_context);
            return Ok(modules);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] StaffModuleItem item)
        {
            if (item == null || string.IsNullOrWhiteSpace(item.ModuleName))
                return BadRequest(new { message = "ModuleName is required." });

            var modules = await ModulesStoreHelper.GetStoredModulesAsync(_context);
            var cleanName = item.ModuleName.Trim().ToLowerInvariant();
            var existing = modules.FirstOrDefault(m => m.ModuleName.Equals(cleanName, StringComparison.OrdinalIgnoreCase));
            if (existing != null)
                return Ok(existing);

            var nextId = modules.Count > 0 ? modules.Max(m => m.Id) + 1 : 1;
            var newMod = new StaffModuleItem
            {
                Id = nextId,
                ModuleName = cleanName,
                Description = item.Description ?? $"Custom {cleanName} module",
                DisplayOrder = item.DisplayOrder > 0 ? item.DisplayOrder : modules.Count
            };
            modules.Add(newMod);
            await ModulesStoreHelper.SaveStoredModulesAsync(_context, modules);
            return Ok(newMod);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var modules = await ModulesStoreHelper.GetStoredModulesAsync(_context);
            var target = modules.FirstOrDefault(m => m.Id == id);
            if (target == null)
                return NotFound(new { message = "Module not found." });

            modules.Remove(target);
            await ModulesStoreHelper.SaveStoredModulesAsync(_context, modules);
            return Ok(new { success = true, message = "Module removed." });
        }
    }

    // Companion controller for /api/Permission called by AddStaff.jsx and StaffList.jsx
    [ApiController]
    [Route("api/[controller]")]
    public class PermissionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PermissionController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("{staffId:int}")]
        public async Task<IActionResult> GetByStaffId(int staffId)
        {
            var staff = await _context.Staff.FindAsync(staffId);
            if (staff == null)
                return Ok(Array.Empty<object>());

            var perms = staff.Permissions ?? new List<string>();
            var responseList = perms.Select((modName, idx) => new
            {
                id = idx + 1,
                staffId = staff.Id,
                moduleId = idx + 1,
                moduleName = modName,
                canView = true,
                canAdd = true,
                canEdit = true,
                canDelete = true,
                isAllowed = true
            }).ToList();

            return Ok(responseList);
        }

        [HttpPost]
        [HttpPut]
        public async Task<IActionResult> SyncPermissions([FromBody] StaffPermissionSyncDto dto)
        {
            if (dto == null || dto.StaffId <= 0)
                return BadRequest(new { message = "Valid StaffId is required." });

            var staff = await _context.Staff.FindAsync(dto.StaffId);
            if (staff == null)
                return NotFound(new { message = "Staff member not found." });

            var mods = await ModulesStoreHelper.GetStoredModulesAsync(_context);
            var moduleMap = mods.ToDictionary(m => m.Id, m => m.ModuleName);

            string[] defaultNames = new[]
            {
                "dashboard", "catalog", "customers", "orders", "stockupdates", "marketing",
                "brands", "blogs", "settings", "suppliers", "coins converter", "call history", "invoices"
            };

            var allowedNames = new List<string>();
            if (dto.StaffPermissions != null)
            {
                foreach (var entry in dto.StaffPermissions)
                {
                    bool allowed = entry.IsAllowed || entry.CanView;
                    if (!allowed) continue;

                    string? resolvedName = entry.ModuleName;
                    if (string.IsNullOrWhiteSpace(resolvedName) && moduleMap.TryGetValue(entry.ModuleId, out var mapped))
                        resolvedName = mapped;
                    if (string.IsNullOrWhiteSpace(resolvedName) && entry.ModuleId >= 1 && entry.ModuleId <= defaultNames.Length)
                        resolvedName = defaultNames[entry.ModuleId - 1];

                    if (!string.IsNullOrWhiteSpace(resolvedName) && !allowedNames.Contains(resolvedName))
                        allowedNames.Add(resolvedName);
                }
            }

            staff.Permissions = allowedNames;
            staff.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(staff.Email))
            {
                var cleanEmail = staff.Email.Trim().ToLowerInvariant();
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == cleanEmail);
                if (user != null)
                {
                    user.PermissionsJson = staff.PermissionsJson;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                staffId = staff.Id,
                permissions = staff.Permissions
            });
        }
    }
}



