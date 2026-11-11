using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Honeywell.Data;
using Honeywell.Models;
using Honeywell.Helpers;

namespace Honeywell.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SuppliersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SuppliersController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AuthorizeModule(PermissionAction.View, "suppliers", "procurement", "catalog")]
        public async Task<ActionResult<IEnumerable<Supplier>>> GetAll()
        {
            return await _context.Suppliers.AsNoTracking().ToListAsync();
        }

        [HttpGet("{id}")]
        [AuthorizeModule(PermissionAction.View, "suppliers", "procurement", "catalog")]
        public async Task<ActionResult<Supplier>> GetById(int id)
        {
            var supplier = await _context.Suppliers.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
            if (supplier == null)
            {
                return NotFound(new { Message = "Supplier not found." });
            }
            return Ok(supplier);
        }

        [HttpPost]
        [AuthorizeModule(PermissionAction.Add, "suppliers", "procurement")]
        public async Task<ActionResult<Supplier>> Create([FromBody] Supplier supplier)
        {
            if (supplier == null)
            {
                return BadRequest(new { Success = false, Message = "Supplier payload is required." });
            }

            // Fallback for businessName
            if (string.IsNullOrWhiteSpace(supplier.Name) && !string.IsNullOrWhiteSpace(supplier.BusinessName))
            {
                supplier.Name = supplier.BusinessName;
            }

            // Fallback for productLines vs ProductCategory
            string effectiveProductLines = !string.IsNullOrWhiteSpace(supplier.ProductLines)
                ? supplier.ProductLines
                : (supplier.ProductCategory ?? string.Empty);

            var (isValid, errors, normalizedGstin, normalizedPhone) = SupplierValidationHelper.ValidateSupplier(
                supplier.Name,
                supplier.ContactPerson,
                supplier.Phone,
                supplier.Email,
                supplier.City,
                supplier.Address,
                supplier.Gstin,
                effectiveProductLines,
                supplier.LeadTime
            );

            if (!isValid)
            {
                return BadRequest(new
                {
                    Success = false,
                    Message = "Validation failed for supplier.",
                    Errors = errors
                });
            }

            // Normalize and trim fields
            supplier.Name = supplier.Name.Trim();
            supplier.ContactPerson = supplier.ContactPerson.Trim();
            supplier.Email = supplier.Email.Trim();
            supplier.Phone = normalizedPhone ?? supplier.Phone.Trim();
            supplier.LeadTime = supplier.LeadTime?.Trim();
            supplier.City = supplier.City?.Trim() ?? string.Empty;
            supplier.Address = supplier.Address.Trim();
            supplier.Gstin = normalizedGstin;
            if (string.IsNullOrWhiteSpace(supplier.ProductCategory) && !string.IsNullOrWhiteSpace(supplier.ProductLines))
            {
                supplier.ProductCategory = supplier.ProductLines.Trim();
            }
            if (!string.IsNullOrWhiteSpace(supplier.PaymentTerms))
            {
                supplier.CommercialTerms = supplier.PaymentTerms.Trim();
            }

            _context.Suppliers.Add(supplier);

            // Add notification
            var notification = new Notification
            {
                Title = "New Supplier added",
                Message = $"Supplier '{supplier.Name}' added by administrator.",
                Type = "NewSupplier",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = supplier.Id }, supplier);
        }

        public class SellerRegistrationRequest
        {
            public string FullName { get; set; } = string.Empty;
            public string BusinessName { get; set; } = string.Empty;
            public string ProductCategory { get; set; } = string.Empty;
            public string MobileNumber { get; set; } = string.Empty;
            public string EmailAddress { get; set; } = string.Empty;
            public string GstinNumber { get; set; } = string.Empty;
            public string BusinessAddress { get; set; } = string.Empty;
        }

        // POST: api/Suppliers/register
        [HttpPost("register")]
        public async Task<IActionResult> RegisterSeller([FromBody] SellerRegistrationRequest request)
        {
            if (string.IsNullOrEmpty(request.BusinessName) || string.IsNullOrEmpty(request.FullName) || string.IsNullOrEmpty(request.MobileNumber))
            {
                return BadRequest(new { Success = false, Message = "Full Name, Business Name, and Mobile Number are required." });
            }

            string? normalizedGstin = null;
            if (!string.IsNullOrWhiteSpace(request.GstinNumber))
            {
                var gstinCheck = GstinValidator.Validate(request.GstinNumber, isRequired: false);
                if (!gstinCheck.IsValid)
                {
                    return BadRequest(new
                    {
                        Success = false,
                        Message = gstinCheck.ErrorMessage ?? "Invalid GSTIN.",
                        Errors = new Dictionary<string, string[]>
                        {
                            { "Gstin", new[] { gstinCheck.ErrorMessage ?? "Enter a valid 15-character GSTIN." } }
                        }
                    });
                }
                normalizedGstin = gstinCheck.NormalizedGstin;
            }

            string trackingId = "SEL" + new Random().Next(100000, 999999).ToString();

            var supplier = new Supplier
            {
                Name = request.BusinessName.Trim(),
                ContactPerson = request.FullName.Trim(),
                Phone = Regex.Replace(request.MobileNumber.Trim(), @"\D", ""),
                Email = request.EmailAddress.Trim(),
                Address = request.BusinessAddress.Trim(),
                Gstin = normalizedGstin,
                ProductCategory = request.ProductCategory.Trim(),
                TrackingId = trackingId,
                Status = "Pending",
                IsActive = false // requires verification
            };

            _context.Suppliers.Add(supplier);

            // Notify Admin
            var notification = new Notification
            {
                Title = "New Seller Application",
                Message = $"Seller registration request submitted by {request.FullName} ({request.BusinessName}). Tracking ID: {trackingId}",
                Type = "NewSupplier",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Success = true,
                TrackingId = trackingId,
                Message = "Application submitted successfully."
            });
        }

        public class SupplierStatusUpdateRequest
        {
            public string Status { get; set; } = string.Empty; // Approved or Rejected
        }

        // PUT: api/Suppliers/{id}/status
        [HttpPut("{id}/status")]
        [AuthorizeModule(PermissionAction.Edit, "suppliers", "procurement")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] SupplierStatusUpdateRequest request)
        {
            if (string.IsNullOrEmpty(request.Status))
            {
                return BadRequest(new { Success = false, Message = "Status is required." });
            }

            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null)
            {
                return NotFound(new { Success = false, Message = "Supplier not found." });
            }

            string targetStatus = request.Status;
            if (request.Status.Equals("Verify", StringComparison.OrdinalIgnoreCase) || 
                request.Status.Equals("Verified", StringComparison.OrdinalIgnoreCase) || 
                request.Status.Equals("Approved", StringComparison.OrdinalIgnoreCase))
            {
                targetStatus = "Verified";
                supplier.IsActive = true;
            }
            else if (request.Status.Equals("Pending", StringComparison.OrdinalIgnoreCase) ||
                     request.Status.Equals("Review", StringComparison.OrdinalIgnoreCase))
            {
                targetStatus = request.Status;
            }
            else if (request.Status.Equals("Inactive", StringComparison.OrdinalIgnoreCase))
            {
                targetStatus = "Inactive";
                supplier.IsActive = false;
            }
            else
            {
                targetStatus = "Rejected";
                supplier.IsActive = false;
            }

            supplier.Status = targetStatus;

            // Notify Admin
            var notification = new Notification
            {
                Title = $"Seller Application {targetStatus.ToUpper()}",
                Message = $"Seller request for '{supplier.Name}' (Tracking ID: {supplier.TrackingId ?? "N/A"}) has been {targetStatus.ToLower()}.",
                Type = targetStatus == "Approved" ? "SupplierApproved" : "SupplierRejected",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();
            return Ok(new { Success = true, Message = $"Supplier verification status successfully updated to {targetStatus}.", Data = supplier });
        }

        [HttpPut("{id}")]
        [AuthorizeModule(PermissionAction.Edit, "suppliers", "procurement")]
        public async Task<IActionResult> Update(int id, [FromBody] Supplier updateData)
        {
            if (updateData == null)
            {
                return BadRequest(new { Success = false, Message = "Supplier payload is required." });
            }

            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null)
            {
                return NotFound(new { Success = false, Message = "Supplier not found." });
            }

            // Fallback for businessName
            if (string.IsNullOrWhiteSpace(updateData.Name) && !string.IsNullOrWhiteSpace(updateData.BusinessName))
            {
                updateData.Name = updateData.BusinessName;
            }

            string effectiveProductLines = !string.IsNullOrWhiteSpace(updateData.ProductLines)
                ? updateData.ProductLines
                : (updateData.ProductCategory ?? supplier.ProductCategory ?? string.Empty);

            var (isValid, errors, normalizedGstin, normalizedPhone) = SupplierValidationHelper.ValidateSupplier(
                updateData.Name,
                updateData.ContactPerson,
                updateData.Phone,
                updateData.Email,
                updateData.City,
                updateData.Address,
                updateData.Gstin,
                effectiveProductLines,
                updateData.LeadTime
            );

            if (!isValid)
            {
                return BadRequest(new
                {
                    Success = false,
                    Message = "Validation failed for supplier.",
                    Errors = errors
                });
            }

            supplier.Name = updateData.Name.Trim();
            supplier.ContactPerson = updateData.ContactPerson.Trim();
            supplier.Phone = normalizedPhone ?? updateData.Phone.Trim();
            supplier.LeadTime = updateData.LeadTime?.Trim();
            supplier.Email = updateData.Email.Trim();
            supplier.Address = updateData.Address.Trim();
            supplier.ProductCount = updateData.ProductCount;
            supplier.PerformanceRating = updateData.PerformanceRating;
            supplier.CommercialTerms = !string.IsNullOrWhiteSpace(updateData.PaymentTerms)
                ? updateData.PaymentTerms.Trim()
                : updateData.CommercialTerms;
            supplier.Gstin = normalizedGstin;
            supplier.ProductCategory = !string.IsNullOrWhiteSpace(updateData.ProductCategory)
                ? updateData.ProductCategory.Trim()
                : effectiveProductLines.Trim();
            supplier.Status = updateData.Status;
            supplier.City = updateData.City?.Trim() ?? string.Empty;
            supplier.LeadTime = updateData.LeadTime;
            supplier.IsActive = updateData.IsActive;

            // Notify Admin
            var notification = new Notification
            {
                Title = "Supplier Profile updated",
                Message = $"Supplier '{supplier.Name}' profile details updated.",
                Type = "SupplierUpdated",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();
            return Ok(new { Success = true, Message = "Supplier profile updated successfully.", Data = supplier });
        }

        [HttpDelete("{id}")]
        [AuthorizeModule(PermissionAction.Delete, "suppliers", "procurement")]
        public async Task<IActionResult> Delete(int id)
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null)
            {
                return NotFound(new { Message = "Supplier not found." });
            }

            _context.Suppliers.Remove(supplier);

            // Notify Admin
            var notification = new Notification
            {
                Title = "Supplier removed",
                Message = $"Supplier '{supplier.Name}' removed from catalog.",
                Type = "SupplierDeleted",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
