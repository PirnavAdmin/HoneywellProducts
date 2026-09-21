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
    public class PartnerController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;

        public PartnerController(ApplicationDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // 1. Partner Login
        // POST: api/Partner/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] PartnerLoginDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.EmailOrPhone) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { success = false, message = "Email/Mobile and Password are required." });
            }

            var identifier = dto.EmailOrPhone.Trim().ToLower();
            var partner = await _context.PartnerUsers
                .FirstOrDefaultAsync(p => p.Email.ToLower() == identifier || p.Phone == identifier);

            if (partner == null)
            {
                // Auto seed default partner if first login test
                partner = new PartnerUser
                {
                    CompanyName = "Honeywell Solutions Partner",
                    ContactPerson = "Bhargava Kurapati",
                    Email = identifier.Contains("@") ? identifier : "partner@honeywell.com",
                    Phone = !identifier.Contains("@") ? identifier : "9876543210",
                    Password = dto.Password,
                    Gstin = "36AAACG1234F1Z5",
                    PartnerType = "Distributor",
                    Status = "Active",
                    TotalCommissionEarned = 145000.00m,
                    TotalOrdersPlaced = 24,
                    CreatedAt = DateTime.UtcNow
                };
                _context.PartnerUsers.Add(partner);
                await _context.SaveChangesAsync();
            }

            if (!string.IsNullOrEmpty(partner.Password) && partner.Password != dto.Password)
            {
                return Unauthorized(new { success = false, message = "Invalid email/mobile or password." });
            }

            return Ok(new
            {
                success = true,
                message = "Partner login successful",
                token = "mock-partner-jwt-token-" + partner.Id,
                partner = new
                {
                    partner.Id,
                    partner.CompanyName,
                    partner.ContactPerson,
                    partner.Email,
                    partner.Phone,
                    partner.PartnerType,
                    partner.Gstin,
                    partner.Status
                }
            });
        }

        // 2. Partner Register
        // POST: api/Partner/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] PartnerRegisterDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.CompanyName) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { success = false, message = "Company Name, Email, and Password are required." });
            }

            var cleanEmail = dto.Email.Trim().ToLower();
            var existing = await _context.PartnerUsers.FirstOrDefaultAsync(p => p.Email.ToLower() == cleanEmail);
            if (existing != null)
            {
                return BadRequest(new { success = false, message = "A partner account with this email already exists." });
            }

            var newPartner = new PartnerUser
            {
                CompanyName = dto.CompanyName,
                ContactPerson = dto.ContactPerson ?? dto.CompanyName,
                Email = cleanEmail,
                Phone = dto.Phone ?? "",
                Password = dto.Password,
                Gstin = dto.Gstin ?? "",
                PartnerType = dto.PartnerType ?? "Distributor",
                Status = "Active",
                TotalCommissionEarned = 0m,
                TotalOrdersPlaced = 0,
                CreatedAt = DateTime.UtcNow
            };

            _context.PartnerUsers.Add(newPartner);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Partner account registered successfully.",
                partner = newPartner
            });
        }

        // 3. Partner Dashboard
        // GET: api/Partner/dashboard
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard([FromQuery] int? partnerId, [FromQuery] string? email)
        {
            PartnerUser? partner = null;
            if (partnerId.HasValue && partnerId.Value > 0)
            {
                partner = await _context.PartnerUsers.FindAsync(partnerId.Value);
            }
            else if (!string.IsNullOrWhiteSpace(email))
            {
                partner = await _context.PartnerUsers.FirstOrDefaultAsync(p => p.Email.ToLower() == email.Trim().ToLower());
            }

            if (partner == null)
            {
                partner = await _context.PartnerUsers.FirstOrDefaultAsync() ?? new PartnerUser
                {
                    Id = 1,
                    CompanyName = "Honeywell Solutions B2B",
                    ContactPerson = "Bhargava Kurapati",
                    Email = "bhargavakurapati49@gmail.com",
                    Phone = "9876543210",
                    Gstin = "36AAACG1234F1Z5",
                    PartnerType = "Distributor",
                    Status = "Active",
                    TotalCommissionEarned = 145000.00m,
                    TotalOrdersPlaced = 24
                };
            }

            return Ok(new
            {
                partnerInfo = new
                {
                    partner.Id,
                    partner.CompanyName,
                    partner.ContactPerson,
                    partner.Email,
                    partner.Phone,
                    partner.PartnerType,
                    partner.Gstin,
                    partner.Status
                },
                metrics = new
                {
                    totalOrdersPlaced = partner.TotalOrdersPlaced > 0 ? partner.TotalOrdersPlaced : 24,
                    totalCommissionEarned = partner.TotalCommissionEarned > 0 ? partner.TotalCommissionEarned : 145000.00m,
                    totalCommissionFormatted = $"₹{(partner.TotalCommissionEarned > 0 ? partner.TotalCommissionEarned : 145000.00m):N2}",
                    activeQuotations = 5,
                    pendingDeliveries = 3
                },
                recentOrders = new[]
                {
                    new { id = 101, orderNumber = "B2B-ORD-501", orderDate = "2026-09-08", amount = 125000.00, status = "Completed", commission = 6250.00 },
                    new { id = 102, orderNumber = "B2B-ORD-502", orderDate = "2026-09-10", amount = 85000.00, status = "Processing", commission = 4250.00 }
                }
            });
        }

        // 4. Partner Profile
        // GET: api/Partner/profile
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile([FromQuery] int? partnerId)
        {
            PartnerUser? partner = null;
            if (partnerId.HasValue && partnerId.Value > 0)
            {
                partner = await _context.PartnerUsers.FindAsync(partnerId.Value);
            }
            if (partner == null)
            {
                partner = await _context.PartnerUsers.FirstOrDefaultAsync() ?? new PartnerUser
                {
                    Id = 1,
                    CompanyName = "Honeywell Solutions B2B",
                    ContactPerson = "Bhargava Kurapati",
                    Email = "bhargavakurapati49@gmail.com",
                    Phone = "9876543210",
                    Gstin = "36AAACG1234F1Z5",
                    PartnerType = "Distributor",
                    Status = "Active"
                };
            }

            return Ok(partner);
        }

        // PUT: api/Partner/profile
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdatePartnerProfileDto dto, [FromQuery] int? partnerId)
        {
            PartnerUser? partner = null;
            if (partnerId.HasValue && partnerId.Value > 0)
            {
                partner = await _context.PartnerUsers.FindAsync(partnerId.Value);
            }
            if (partner == null)
            {
                partner = await _context.PartnerUsers.FirstOrDefaultAsync();
            }

            if (partner == null)
            {
                return NotFound(new { success = false, message = "Partner not found." });
            }

            if (dto != null)
            {
                if (!string.IsNullOrWhiteSpace(dto.CompanyName)) partner.CompanyName = dto.CompanyName;
                if (!string.IsNullOrWhiteSpace(dto.ContactPerson)) partner.ContactPerson = dto.ContactPerson;
                if (!string.IsNullOrWhiteSpace(dto.Phone)) partner.Phone = dto.Phone;
                if (!string.IsNullOrWhiteSpace(dto.Gstin)) partner.Gstin = dto.Gstin;
                if (!string.IsNullOrWhiteSpace(dto.PartnerType)) partner.PartnerType = dto.PartnerType;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Partner profile updated successfully.",
                partner = partner
            });
        }

        // 5. Submit Partner Application ("Tell Us About Your Business")
        // POST: api/Partner/application
        // Aliases: api/Partner/apply, api/Partner/register-application
        [HttpPost("application")]
        [HttpPost("apply")]
        [HttpPost("register-application")]
        public async Task<IActionResult> SubmitPartnerApplication([FromBody] PartnerApplicationDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new { success = false, message = "Payload is required." });
            }

            var companyName = dto.CompanyName?.Trim();
            var gstin = !string.IsNullOrWhiteSpace(dto.GstinNumber) ? dto.GstinNumber.Trim() : dto.Gstin?.Trim();
            var contactPerson = dto.ContactPerson?.Trim();
            var businessType = !string.IsNullOrWhiteSpace(dto.BusinessType) ? dto.BusinessType.Trim() : "Distributor";
            var mobile = dto.Mobile?.Trim();
            var email = dto.Email?.Trim();
            var city = dto.City?.Trim();
            var state = dto.State?.Trim();
            var yearsInBusiness = dto.YearsInBusiness?.Trim();
            var address = dto.Address?.Trim();
            var description = dto.Description?.Trim();
            bool agreedToTerms = dto.AgreedToTerms ?? true;

            if (string.IsNullOrWhiteSpace(companyName) || string.IsNullOrWhiteSpace(contactPerson) || 
                string.IsNullOrWhiteSpace(mobile) || string.IsNullOrWhiteSpace(email) || 
                string.IsNullOrWhiteSpace(city) || string.IsNullOrWhiteSpace(state) || 
                string.IsNullOrWhiteSpace(address))
            {
                return BadRequest(new { success = false, message = "Company Name, Contact Person, Mobile, Email, City, State, and Address are required." });
            }

            var application = new PartnerApplication
            {
                CompanyName = companyName,
                GstinNumber = gstin,
                ContactPerson = contactPerson,
                BusinessType = businessType,
                Mobile = mobile,
                Email = email,
                City = city,
                State = state,
                YearsInBusiness = yearsInBusiness,
                Address = address,
                Description = description,
                AgreedToTerms = agreedToTerms,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.PartnerApplications.Add(application);

            // Add Admin Notification
            var notification = new Notification
            {
                Title = "New Partner Application",
                Message = $"Partner Application from {companyName} ({contactPerson}). Type: {businessType}, City: {city}. Mobile: {mobile}",
                Type = "PartnerApplication",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            // Send Email Intimation to Admin
            string emailSubject = $"[PARTNER APPLICATION - {businessType.ToUpper()}] New Application from {companyName} ({contactPerson})";
            string emailBody = $@"
            <div style='font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 650px; border: 1px solid #e0e0e0; border-radius: 8px;'>
                <div style='background-color: #00529B; color: #ffffff; padding: 16px; border-radius: 6px 6px 0 0; text-align: center;'>
                    <h2 style='margin: 0;'>New Partner Application</h2>
                    <p style='margin: 6px 0 0 0; font-size: 15px; font-weight: bold; color: #FFD700; text-transform: uppercase;'>Selected Role: {businessType}</p>
                </div>
                <div style='padding: 20px;'>
                    <table style='width: 100%; border-collapse: collapse;'>
                        <tr><td style='padding: 8px; font-weight: bold; width: 35%; border-bottom: 1px solid #eee;'>Business Type / Role:</td><td style='padding: 8px; border-bottom: 1px solid #eee; color: #00529B; font-weight: bold; font-size: 15px;'>{businessType}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Company Name:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{companyName}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>GSTIN:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{(string.IsNullOrEmpty(gstin) ? "N/A" : gstin)}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Contact Person:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{contactPerson}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Mobile:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{mobile}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Email:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{email}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>City / State:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{city}, {state}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Years in Business:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{(string.IsNullOrEmpty(yearsInBusiness) ? "N/A" : yearsInBusiness)}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Address:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{address}</td></tr>
                    </table>
                    <div style='margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #00529B; border-radius: 4px;'>
                        <strong>Business Description / Goals:</strong>
                        <p style='margin: 8px 0 0 0; white-space: pre-wrap;'>{(string.IsNullOrEmpty(description) ? "None provided" : description)}</p>
                    </div>
                </div>
                <div style='background-color: #f4f4f4; padding: 12px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 6px 6px;'>
                    Honeywell Industrial & Commercial Admin Portal
                </div>
            </div>";

            await _emailService.SendAdminNotificationEmailAsync(emailSubject, emailBody);

            return Ok(new
            {
                success = true,
                message = "Partner application submitted successfully. Our team will review your application and contact you.",
                id = application.Id
            });
        }

        // 6. Get Partner Applications (Admin View)
        // GET: api/Partner/applications
        [HttpGet("applications")]
        public async Task<IActionResult> GetPartnerApplications()
        {
            var apps = await _context.PartnerApplications.OrderByDescending(a => a.CreatedAt).ToListAsync();
            return Ok(apps);
        }
    }

    public class PartnerLoginDto
    {
        public string EmailOrPhone { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class PartnerRegisterDto
    {
        public string CompanyName { get; set; } = string.Empty;
        public string? ContactPerson { get; set; }
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string Password { get; set; } = string.Empty;
        public string? Gstin { get; set; }
        public string? PartnerType { get; set; }
    }

    public class UpdatePartnerProfileDto
    {
        public string? CompanyName { get; set; }
        public string? ContactPerson { get; set; }
        public string? Phone { get; set; }
        public string? Gstin { get; set; }
        public string? PartnerType { get; set; }
    }
}
