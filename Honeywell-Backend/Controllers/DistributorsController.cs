using System;
using System.Collections.Generic;
using System.Linq;
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
    [Route("api/Business/distributors")]
    [Route("api/Dealers")]
    public class DistributorsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;

        private static bool _tableEnsured = false;
        private static readonly object _tableLock = new object();

        public DistributorsController(ApplicationDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        private async Task EnsureTableCreatedAsync()
        {
            if (_tableEnsured) return;
            lock (_tableLock)
            {
                if (_tableEnsured) return;
                _tableEnsured = true;
            }

            try
            {
                var sql = @"
                CREATE TABLE IF NOT EXISTS `Distributors` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `Name` VARCHAR(255) NOT NULL,
                    `PartnerType` VARCHAR(100) NOT NULL DEFAULT 'Authorized Distributor',
                    `BadgeText` VARCHAR(100) NOT NULL DEFAULT 'AUTHORIZED',
                    `Region` VARCHAR(100) NOT NULL DEFAULT 'Central India',
                    `Territory` VARCHAR(100) NOT NULL DEFAULT 'Central India',
                    `CoverageLocations` VARCHAR(255) NOT NULL DEFAULT 'Pan India',
                    `Address` TEXT,
                    `ContactPerson` VARCHAR(255) NOT NULL,
                    `ContactTitle` VARCHAR(100) NOT NULL DEFAULT 'Channel Sales Lead',
                    `Phone` VARCHAR(50) NOT NULL DEFAULT '',
                    `Email` VARCHAR(255) NOT NULL DEFAULT '',
                    `Gstin` VARCHAR(100) NOT NULL DEFAULT '',
                    `ProductCategories` TEXT,
                    `DispatchSla` VARCHAR(100) NOT NULL DEFAULT '24-48 Hours Express',
                    `BufferCapacity` VARCHAR(100) NOT NULL DEFAULT 'Stock Ready',
                    `CommercialTerms` VARCHAR(255) NOT NULL DEFAULT 'Wholesale Commercial Terms',
                    `Rating` VARCHAR(50) NOT NULL DEFAULT '4.8/5 (Verified)',
                    `Description` TEXT,
                    `IsVerified` TINYINT(1) NOT NULL DEFAULT 1,
                    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
                    `DisplayOrder` INT NOT NULL DEFAULT 0,
                    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `UpdatedAt` DATETIME NULL
                );";
                await _context.Database.ExecuteSqlRawAsync(sql);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DistributorsController] EnsureTable error: {ex.Message}");
            }
        }

        // 1. GET: api/Distributors  (or api/Business/distributors, api/Dealers)
        // Returns active distributors / partners directory for frontend cards
        [HttpGet]
        public async Task<IActionResult> GetDirectory(
            [FromQuery] string? search,
            [FromQuery] string? region,
            [FromQuery] string? type,
            [FromQuery] string? partnerType,
            [FromQuery] string? category,
            [FromQuery] bool? isVerified)
        {
            await EnsureTableCreatedAsync();
            try
            {
                var query = _context.Distributors
                    .AsNoTracking()
                    .Where(d => d.IsActive)
                    .AsQueryable();

                var targetType = !string.IsNullOrWhiteSpace(type) ? type : partnerType;

                if (!string.IsNullOrWhiteSpace(region) && !region.Equals("All", StringComparison.OrdinalIgnoreCase) && !region.Equals("All Regions", StringComparison.OrdinalIgnoreCase))
                {
                    var r = region.Trim().ToLower();
                    query = query.Where(d => d.Region.ToLower().Contains(r) || d.Territory.ToLower().Contains(r));
                }

                if (!string.IsNullOrWhiteSpace(targetType) && !targetType.Equals("All", StringComparison.OrdinalIgnoreCase) && !targetType.Equals("All Types", StringComparison.OrdinalIgnoreCase))
                {
                    var t = targetType.Trim().ToLower();
                    query = query.Where(d => d.PartnerType.ToLower().Contains(t) || d.BadgeText.ToLower().Contains(t));
                }

                if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase))
                {
                    var c = category.Trim().ToLower();
                    query = query.Where(d => d.ProductCategories.ToLower().Contains(c));
                }

                if (isVerified.HasValue)
                {
                    query = query.Where(d => d.IsVerified == isVerified.Value);
                }

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var s = search.Trim().ToLower();
                    query = query.Where(d =>
                        d.Name.ToLower().Contains(s) ||
                        d.ContactPerson.ToLower().Contains(s) ||
                        d.Email.ToLower().Contains(s) ||
                        d.Phone.Contains(s) ||
                        d.Gstin.ToLower().Contains(s) ||
                        d.CoverageLocations.ToLower().Contains(s) ||
                        d.Region.ToLower().Contains(s) ||
                        d.ProductCategories.ToLower().Contains(s)
                    );
                }

                var list = await query
                    .OrderBy(d => d.DisplayOrder)
                    .ThenByDescending(d => d.CreatedAt)
                    .ToListAsync();

                // Format response objects with parsed tags array and rich UI properties
                var formatted = list.Select(d => FormatDistributorResponse(d)).ToList();

                return Ok(new
                {
                    success = true,
                    count = formatted.Count,
                    distributors = formatted,
                    data = formatted
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error retrieving distributors directory: {ex}");
                return StatusCode(500, new { success = false, message = "Error retrieving distributors.", error = ex.Message });
            }
        }

        // 2. GET: api/Distributors/5
        // Returns detailed modal data for single partner / distributor
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _context.Distributors.AsNoTracking().FirstOrDefaultAsync(d => d.Id == id);
            if (item == null)
            {
                return NotFound(new { success = false, message = "Distributor / Partner not found." });
            }

            return Ok(new
            {
                success = true,
                distributor = FormatDistributorResponse(item),
                data = FormatDistributorResponse(item)
            });
        }

        // 3. GET: api/Distributors/regions
        // Returns available regions for UI filtering
        [HttpGet("regions")]
        public async Task<IActionResult> GetRegions()
        {
            await EnsureTableCreatedAsync();
            var regions = new List<string>();
            try
            {
                regions = await _context.Distributors
                    .AsNoTracking()
                    .Where(d => d.IsActive && !string.IsNullOrEmpty(d.Region))
                    .Select(d => d.Region)
                    .Distinct()
                    .ToListAsync();
            }
            catch { }

            if (!regions.Contains("West India")) regions.Add("West India");
            if (!regions.Contains("South India")) regions.Add("South India");
            if (!regions.Contains("Central India")) regions.Add("Central India");
            if (!regions.Contains("East India")) regions.Add("East India");
            if (!regions.Contains("North India")) regions.Add("North India");

            return Ok(new
            {
                success = true,
                regions = regions.Distinct().OrderBy(r => r).ToList()
            });
        }

        // 4. GET: api/Distributors/types
        // Returns partner/dealer types for UI filtering
        [HttpGet("types")]
        public async Task<IActionResult> GetTypes()
        {
            await EnsureTableCreatedAsync();
            var types = new List<string>();
            try
            {
                types = await _context.Distributors
                    .AsNoTracking()
                    .Where(d => d.IsActive && !string.IsNullOrEmpty(d.PartnerType))
                    .Select(d => d.PartnerType)
                    .Distinct()
                    .ToListAsync();
            }
            catch { }

            if (!types.Contains("Authorized Distributor")) types.Add("Authorized Distributor");
            if (!types.Contains("Official Verified Distributor")) types.Add("Official Verified Distributor");
            if (!types.Contains("Official Verified Dealer")) types.Add("Official Verified Dealer");
            if (!types.Contains("System Integrator")) types.Add("System Integrator");

            return Ok(new
            {
                success = true,
                types = types.Distinct().OrderBy(t => t).ToList()
            });
        }

        // 5. POST: api/Distributors/quote-request or api/Distributors/{id}/quote-request
        // Customer requests a quote for a specific distributor / dealer
        [HttpPost("quote-request")]
        [HttpPost("{id:int}/quote-request")]
        public async Task<IActionResult> RequestQuote(int? id, [FromBody] DistributorQuoteRequestDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new { success = false, message = "Quote request payload is required." });
            }

            int targetId = id ?? dto.DistributorId ?? 0;
            Distributor? dist = null;
            if (targetId > 0)
            {
                dist = await _context.Distributors.FindAsync(targetId);
            }

            var name = !string.IsNullOrWhiteSpace(dto.Name) ? dto.Name.Trim() : "Valued Customer";
            var mobile = dto.Mobile?.Trim() ?? "";
            var email = dto.Email?.Trim() ?? "";
            var company = dto.CompanyName?.Trim() ?? (dist != null ? dist.Name : "N/A");
            var requirement = dto.ProductRequirement?.Trim() ?? dto.Notes?.Trim() ?? "Requesting commercial quote & product pricing.";
            var distName = dist != null ? dist.Name : (dto.DistributorName ?? "Authorized Partner");

            if (string.IsNullOrWhiteSpace(mobile) && string.IsNullOrWhiteSpace(email))
            {
                return BadRequest(new { success = false, message = "Mobile number or Email address is required." });
            }

            // Save to BulkQuoteRequests table
            var bulkReq = new BulkQuoteRequest
            {
                Name = name,
                CompanyName = company,
                GstinNumber = dist?.Gstin,
                Mobile = mobile,
                Email = email,
                Location = dist?.CoverageLocations ?? dist?.Region ?? "India",
                Product = $"Distributor Quote Request ({distName})",
                Quantity = dto.Quantity ?? 1,
                Requirement = $"Quote requested for Distributor: {distName}. Requirement Notes: {requirement}",
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.BulkQuoteRequests.Add(bulkReq);

            // Add Notification for Admin
            _context.Notifications.Add(new Notification
            {
                Title = "New Distributor Quote Request",
                Message = $"Quote Request received from {name} ({mobile}) for Distributor: {distName}.",
                Type = "DistributorQuote",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            });

            await _context.SaveChangesAsync();

            // Send Notification Email
            string emailSubject = $"[DISTRIBUTOR QUOTE REQUEST] Enquiry for {distName}";
            string emailBody = $@"
            <div style='font-family: Arial, sans-serif; padding: 20px; color: #333;'>
                <h2 style='color: #00529B;'>New Distributor Quote Request</h2>
                <p>A customer has requested a commercial quote for <strong>{distName}</strong>.</p>
                <table style='width: 100%; border-collapse: collapse; margin-top: 15px;'>
                    <tr><td style='padding: 8px; font-weight: bold;'>Target Distributor:</td><td style='padding: 8px;'>{distName} (GST: {dist?.Gstin ?? "N/A"})</td></tr>
                    <tr><td style='padding: 8px; font-weight: bold;'>Customer Name:</td><td style='padding: 8px;'>{name}</td></tr>
                    <tr><td style='padding: 8px; font-weight: bold;'>Company:</td><td style='padding: 8px;'>{company}</td></tr>
                    <tr><td style='padding: 8px; font-weight: bold;'>Mobile:</td><td style='padding: 8px;'>{mobile}</td></tr>
                    <tr><td style='padding: 8px; font-weight: bold;'>Email:</td><td style='padding: 8px;'>{email}</td></tr>
                    <tr><td style='padding: 8px; font-weight: bold;'>Requirement Notes:</td><td style='padding: 8px;'>{requirement}</td></tr>
                </table>
            </div>";

            await _emailService.SendAdminNotificationEmailAsync(emailSubject, emailBody);

            return Ok(new
            {
                success = true,
                message = $"Quote request for {distName} submitted successfully.",
                id = bulkReq.Id
            });
        }

        // ==========================================
        // ADMIN SIDE ENDPOINTS (Manage Dealers/Distributors)
        // ==========================================

        // 6. GET: api/Distributors/admin/all
        // Admin views all dealers / distributors (including inactive)
        [HttpGet("admin/all")]
        public async Task<IActionResult> GetAllAdmin([FromQuery] string? search, [FromQuery] string? region)
        {
            var query = _context.Distributors.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(region))
            {
                query = query.Where(d => d.Region.ToLower().Contains(region.Trim().ToLower()));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(d =>
                    d.Name.ToLower().Contains(s) ||
                    d.ContactPerson.ToLower().Contains(s) ||
                    d.Email.ToLower().Contains(s) ||
                    d.Phone.Contains(s)
                );
            }

            var list = await query.OrderBy(d => d.DisplayOrder).ThenByDescending(d => d.CreatedAt).ToListAsync();
            var formatted = list.Select(d => FormatDistributorResponse(d)).ToList();

            return Ok(new
            {
                success = true,
                count = formatted.Count,
                distributors = formatted
            });
        }

        private async Task<DistributorUpsertDto> ResolveUpsertDtoAsync()
        {
            var dto = new DistributorUpsertDto();

            // 1. Check if payload was sent as multipart/form-data or application/x-www-form-urlencoded
            if (Request.HasFormContentType)
            {
                try
                {
                    var form = await Request.ReadFormAsync();
                    string Val(params string[] keys)
                    {
                        foreach (var k in keys)
                        {
                            if (form.TryGetValue(k, out var v) && !string.IsNullOrWhiteSpace(v.ToString()))
                                return v.ToString().Trim();
                        }
                        return "";
                    }

                    dto.Name = Val("name", "Name", "companyName", "CompanyName");
                    dto.PartnerType = Val("partnerType", "PartnerType");
                    dto.BadgeText = Val("badgeText", "BadgeText");
                    dto.Region = Val("region", "Region");
                    dto.Territory = Val("territory", "Territory");
                    dto.CoverageLocations = Val("coverageLocations", "CoverageLocations");
                    dto.Address = Val("address", "Address");
                    dto.ContactPerson = Val("contactPerson", "ContactPerson");
                    dto.ContactTitle = Val("contactTitle", "ContactTitle");
                    dto.Phone = Val("phone", "Phone");
                    dto.Email = Val("email", "Email");
                    dto.Gstin = Val("gstin", "Gstin", "gst", "Gst");
                    dto.ProductCategories = Val("productCategories", "ProductCategories");
                    dto.DispatchSla = Val("dispatchSla", "DispatchSla");
                    dto.BufferCapacity = Val("bufferCapacity", "BufferCapacity");
                    dto.CommercialTerms = Val("commercialTerms", "CommercialTerms");
                    dto.Rating = Val("rating", "Rating");
                    dto.Description = Val("description", "Description");

                    var iv = Val("isVerified", "IsVerified");
                    if (!string.IsNullOrWhiteSpace(iv) && bool.TryParse(iv, out var isV)) dto.IsVerified = isV;

                    var ia = Val("isActive", "IsActive");
                    if (!string.IsNullOrWhiteSpace(ia) && bool.TryParse(ia, out var isA)) dto.IsActive = isA;

                    var doVal = Val("displayOrder", "DisplayOrder");
                    if (!string.IsNullOrWhiteSpace(doVal) && int.TryParse(doVal, out var ord)) dto.DisplayOrder = ord;

                    return dto;
                }
                catch { }
            }

            // 2. Read raw JSON or text body from Request.Body
            try
            {
                Request.EnableBuffering();
                Request.Body.Position = 0;
                using var reader = new System.IO.StreamReader(Request.Body, System.Text.Encoding.UTF8, leaveOpen: true);
                var bodyText = await reader.ReadToEndAsync();
                Request.Body.Position = 0;

                if (!string.IsNullOrWhiteSpace(bodyText))
                {
                    var options = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var parsed = System.Text.Json.JsonSerializer.Deserialize<DistributorUpsertDto>(bodyText, options);
                    if (parsed != null) return parsed;
                }
            }
            catch { }

            return dto;
        }

        // 7. POST: api/Distributors
        // Admin creates new distributor / dealer
        [HttpPost]
        [Consumes("application/json", "multipart/form-data", "application/x-www-form-urlencoded", "text/plain")]
        public async Task<IActionResult> Create()
        {
            var dto = await ResolveUpsertDtoAsync();

            if (dto == null || string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new { success = false, message = "Distributor / Dealer Name is required." });
            }

            var item = new Distributor
            {
                Name = dto.Name.Trim(),
                PartnerType = !string.IsNullOrWhiteSpace(dto.PartnerType) ? dto.PartnerType.Trim() : "Authorized Distributor",
                BadgeText = !string.IsNullOrWhiteSpace(dto.BadgeText) ? dto.BadgeText.Trim() : "AUTHORIZED",
                Region = !string.IsNullOrWhiteSpace(dto.Region) ? dto.Region.Trim() : "Central India",
                Territory = !string.IsNullOrWhiteSpace(dto.Territory) ? dto.Territory.Trim() : dto.Region ?? "Central India",
                CoverageLocations = !string.IsNullOrWhiteSpace(dto.CoverageLocations) ? dto.CoverageLocations.Trim() : "Pan India",
                Address = dto.Address?.Trim() ?? "",
                ContactPerson = !string.IsNullOrWhiteSpace(dto.ContactPerson) ? dto.ContactPerson.Trim() : dto.Name.Trim(),
                ContactTitle = !string.IsNullOrWhiteSpace(dto.ContactTitle) ? dto.ContactTitle.Trim() : "Channel Sales Lead",
                Phone = dto.Phone?.Trim() ?? "",
                Email = dto.Email?.Trim() ?? "",
                Gstin = dto.Gstin?.Trim() ?? "",
                ProductCategories = !string.IsNullOrWhiteSpace(dto.ProductCategories) ? dto.ProductCategories.Trim() : "Commercial Security, IP Cameras",
                DispatchSla = !string.IsNullOrWhiteSpace(dto.DispatchSla) ? dto.DispatchSla.Trim() : "24-48 Hours Express",
                BufferCapacity = !string.IsNullOrWhiteSpace(dto.BufferCapacity) ? dto.BufferCapacity.Trim() : "Stock Ready",
                CommercialTerms = !string.IsNullOrWhiteSpace(dto.CommercialTerms) ? dto.CommercialTerms.Trim() : "Wholesale Commercial Terms",
                Rating = !string.IsNullOrWhiteSpace(dto.Rating) ? dto.Rating.Trim() : "4.8/5 (Verified)",
                Description = dto.Description?.Trim() ?? "",
                IsVerified = dto.IsVerified ?? true,
                IsActive = dto.IsActive ?? true,
                DisplayOrder = dto.DisplayOrder ?? 0,
                CreatedAt = DateTime.UtcNow
            };

            _context.Distributors.Add(item);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Distributor / Dealer added successfully.",
                distributor = FormatDistributorResponse(item)
            });
        }

        // 8. PUT: api/Distributors/5
        // Admin updates distributor / dealer
        [HttpPut("{id:int}")]
        [Consumes("application/json", "multipart/form-data", "application/x-www-form-urlencoded", "text/plain")]
        public async Task<IActionResult> Update(int id)
        {
            var item = await _context.Distributors.FindAsync(id);
            if (item == null)
            {
                return NotFound(new { success = false, message = "Distributor / Dealer not found." });
            }

            var dto = await ResolveUpsertDtoAsync();

            if (dto != null)
            {
                if (!string.IsNullOrWhiteSpace(dto.Name)) item.Name = dto.Name.Trim();
                if (!string.IsNullOrWhiteSpace(dto.PartnerType)) item.PartnerType = dto.PartnerType.Trim();
                if (!string.IsNullOrWhiteSpace(dto.BadgeText)) item.BadgeText = dto.BadgeText.Trim();
                if (!string.IsNullOrWhiteSpace(dto.Region)) item.Region = dto.Region.Trim();
                if (!string.IsNullOrWhiteSpace(dto.Territory)) item.Territory = dto.Territory.Trim();
                if (!string.IsNullOrWhiteSpace(dto.CoverageLocations)) item.CoverageLocations = dto.CoverageLocations.Trim();
                if (dto.Address != null) item.Address = dto.Address.Trim();
                if (!string.IsNullOrWhiteSpace(dto.ContactPerson)) item.ContactPerson = dto.ContactPerson.Trim();
                if (!string.IsNullOrWhiteSpace(dto.ContactTitle)) item.ContactTitle = dto.ContactTitle.Trim();
                if (dto.Phone != null) item.Phone = dto.Phone.Trim();
                if (dto.Email != null) item.Email = dto.Email.Trim();
                if (dto.Gstin != null) item.Gstin = dto.Gstin.Trim();
                if (dto.ProductCategories != null) item.ProductCategories = dto.ProductCategories.Trim();
                if (!string.IsNullOrWhiteSpace(dto.DispatchSla)) item.DispatchSla = dto.DispatchSla.Trim();
                if (!string.IsNullOrWhiteSpace(dto.BufferCapacity)) item.BufferCapacity = dto.BufferCapacity.Trim();
                if (!string.IsNullOrWhiteSpace(dto.CommercialTerms)) item.CommercialTerms = dto.CommercialTerms.Trim();
                if (!string.IsNullOrWhiteSpace(dto.Rating)) item.Rating = dto.Rating.Trim();
                if (dto.Description != null) item.Description = dto.Description.Trim();
                if (dto.IsVerified.HasValue) item.IsVerified = dto.IsVerified.Value;
                if (dto.IsActive.HasValue) item.IsActive = dto.IsActive.Value;
                if (dto.DisplayOrder.HasValue) item.DisplayOrder = dto.DisplayOrder.Value;

                item.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Distributor / Dealer updated successfully.",
                distributor = FormatDistributorResponse(item)
            });
        }

        // 9. PATCH: api/Distributors/5/toggle-status
        [HttpPatch("{id:int}/toggle-status")]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            var item = await _context.Distributors.FindAsync(id);
            if (item == null)
            {
                return NotFound(new { success = false, message = "Distributor / Dealer not found." });
            }

            item.IsActive = !item.IsActive;
            item.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"Distributor is now {(item.IsActive ? "Active" : "Inactive")}.",
                isActive = item.IsActive
            });
        }

        // 10. PATCH: api/Distributors/5/display-order
        [HttpPatch("{id:int}/display-order")]
        public async Task<IActionResult> UpdateDisplayOrder(int id, [FromQuery] int displayOrder)
        {
            var item = await _context.Distributors.FindAsync(id);
            if (item == null)
            {
                return NotFound(new { success = false, message = "Distributor / Dealer not found." });
            }

            item.DisplayOrder = displayOrder;
            item.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Display order updated successfully.",
                displayOrder = item.DisplayOrder
            });
        }

        // 11. DELETE: api/Distributors/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _context.Distributors.FindAsync(id);
            if (item == null)
            {
                return NotFound(new { success = false, message = "Distributor / Dealer not found." });
            }

            _context.Distributors.Remove(item);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Distributor / Dealer entry deleted successfully."
            });
        }

        // --- Helper Formatter Function ---
        private static object FormatDistributorResponse(Distributor d)
        {
            // Parse comma-separated categories into array for tags UI
            var tagsList = !string.IsNullOrWhiteSpace(d.ProductCategories)
                ? d.ProductCategories.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList()
                : new List<string>();

            return new Dictionary<string, object?>
            {
                ["id"] = d.Id,
                ["Id"] = d.Id,
                ["name"] = d.Name,
                ["Name"] = d.Name,
                ["companyName"] = d.Name,
                ["partnerType"] = d.PartnerType,
                ["PartnerType"] = d.PartnerType,
                ["badgeText"] = d.BadgeText,
                ["BadgeText"] = d.BadgeText,
                ["region"] = d.Region,
                ["Region"] = d.Region,
                ["territory"] = d.Territory,
                ["Territory"] = d.Territory,
                ["coverageLocations"] = d.CoverageLocations,
                ["CoverageLocations"] = d.CoverageLocations,
                ["address"] = d.Address,
                ["Address"] = d.Address,

                // Commercial Contact Lead Box
                ["contactPerson"] = d.ContactPerson,
                ["ContactPerson"] = d.ContactPerson,
                ["contactTitle"] = d.ContactTitle,
                ["ContactTitle"] = d.ContactTitle,
                ["phone"] = d.Phone,
                ["Phone"] = d.Phone,
                ["email"] = d.Email,
                ["Email"] = d.Email,
                ["gstin"] = d.Gstin,
                ["Gstin"] = d.Gstin,
                ["gst"] = d.Gstin,
                ["Gst"] = d.Gstin,

                // Product Specialization & Tags
                ["productCategories"] = d.ProductCategories,
                ["ProductCategories"] = d.ProductCategories,
                ["tags"] = tagsList,
                ["Tags"] = tagsList,

                // Logistics & SLA Highlights Box
                ["dispatchSla"] = d.DispatchSla,
                ["DispatchSla"] = d.DispatchSla,
                ["bufferCapacity"] = d.BufferCapacity,
                ["BufferCapacity"] = d.BufferCapacity,
                ["commercialTerms"] = d.CommercialTerms,
                ["CommercialTerms"] = d.CommercialTerms,
                ["rating"] = d.Rating,
                ["Rating"] = d.Rating,
                ["description"] = d.Description,
                ["Description"] = d.Description,

                // Status & Controls
                ["isVerified"] = d.IsVerified,
                ["IsVerified"] = d.IsVerified,
                ["isActive"] = d.IsActive,
                ["IsActive"] = d.IsActive,
                ["displayOrder"] = d.DisplayOrder,
                ["DisplayOrder"] = d.DisplayOrder,
                ["createdAt"] = d.CreatedAt,
                ["CreatedAt"] = d.CreatedAt
            };
        }
    }
}
