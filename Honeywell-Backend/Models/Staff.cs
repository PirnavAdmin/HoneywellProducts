using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Honeywell.Models
{
    public class Staff
    {
        public int Id { get; set; }
        public string EmployeeId { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string MobileNumber { get; set; } = string.Empty;
        public string Role { get; set; } = "Advisory"; // e.g. Admin, Advisory, Inventory, Manager, Sales, Staff
        public string Department { get; set; } = "General";
        public string Password { get; set; } = string.Empty;
        public string Status { get; set; } = "Active"; // Active, Inactive, On Leave
        public bool IsActive { get; set; } = true;

        [JsonIgnore]
        public string? PermissionsJson { get; set; }

        [NotMapped]
        public List<string> Permissions
        {
            get
            {
                if (string.IsNullOrWhiteSpace(PermissionsJson))
                    return new List<string>();
                try
                {
                    return JsonSerializer.Deserialize<List<string>>(PermissionsJson) ?? new List<string>();
                }
                catch
                {
                    return new List<string>();
                }
            }
            set
            {
                PermissionsJson = value != null ? JsonSerializer.Serialize(value) : null;
            }
        }

        public DateTime DateJoined { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }

    public class StaffStatusPatchDto
    {
        public string? Status { get; set; }
        public bool? IsActive { get; set; }
    }

    public class StaffLoginRequestDto
    {
        public string Email { get; set; } = string.Empty;
        public string? EmployeeId { get; set; }
        public string Password { get; set; } = string.Empty;
    }

    public class StaffModuleItem
    {
        public int Id { get; set; }
        public string ModuleName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DisplayOrder { get; set; }
    }

    public class StaffPermissionSyncDto
    {
        public int StaffId { get; set; }
        public List<StaffPermissionEntryDto> StaffPermissions { get; set; } = new();
    }

    public class StaffPermissionEntryDto
    {
        public int ModuleId { get; set; }
        public string? ModuleName { get; set; }
        public bool CanView { get; set; }
        public bool CanAdd { get; set; }
        public bool CanEdit { get; set; }
        public bool CanDelete { get; set; }
        public bool IsAllowed { get; set; }
    }

    public class StaffPermissionsUpdateDto
    {
        public List<string>? Permissions { get; set; }
        public List<string>? Modules { get; set; }
        public Dictionary<string, bool>? ModulePermissions { get; set; }
        public List<StaffPermissionEntryDto>? StaffPermissions { get; set; }
    }

    public class StaffRoleItem
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string DefaultDepartment { get; set; } = "General Operations";
        public bool IsSystemRole { get; set; }
        public List<string> Permissions { get; set; } = new();
    }

    public class CreateOrUpdateRoleDto
    {
        public string? Code { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Label { get; set; }
        public string? Description { get; set; }
        public string? DefaultDepartment { get; set; }
        public List<string>? Permissions { get; set; }
        public List<string>? DefaultPermissions { get; set; }
    }
}


