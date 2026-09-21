using System;
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
    public class EnquiryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;

        public EnquiryController(ApplicationDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // ==========================================
        // 1. BULK QUOTE REQUEST API
        // POST: api/Enquiry/bulk-quote
        // Aliases: api/BulkQuote, api/Quotes/bulk
        // ==========================================
        [HttpPost("bulk-quote")]
        [HttpPost("/api/BulkQuote")]
        [HttpPost("/api/Quotes/bulk")]
        public async Task<IActionResult> RequestBulkQuote([FromBody] BulkQuoteRequestDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new { success = false, message = "Payload is required." });
            }

            var name = dto.Name?.Trim();
            var company = dto.CompanyName?.Trim();
            var mobile = dto.Mobile?.Trim();
            var email = dto.Email?.Trim();
            var location = dto.Location?.Trim();
            var requirementText = !string.IsNullOrWhiteSpace(dto.Requirement) ? dto.Requirement.Trim() : dto.Message?.Trim();
            var gstin = !string.IsNullOrWhiteSpace(dto.GstinNumber) ? dto.GstinNumber.Trim() : dto.Gstin?.Trim();
            var product = !string.IsNullOrWhiteSpace(dto.Product) ? dto.Product.Trim() : "General bulk requirement";

            if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(company) || 
                string.IsNullOrWhiteSpace(mobile) || string.IsNullOrWhiteSpace(email) || 
                string.IsNullOrWhiteSpace(location) || string.IsNullOrWhiteSpace(requirementText))
            {
                return BadRequest(new { success = false, message = "Name, Company Name, Mobile, Email, Location, and Requirement details are required." });
            }

            int qty = 1;
            if (dto.Quantity != null && int.TryParse(dto.Quantity.ToString(), out int parsedQty) && parsedQty > 0)
            {
                qty = parsedQty;
            }

            var bulkQuote = new BulkQuoteRequest
            {
                Name = name,
                CompanyName = company,
                GstinNumber = gstin,
                Mobile = mobile,
                Email = email,
                Location = location,
                Product = product,
                Quantity = qty,
                Requirement = requirementText,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.BulkQuoteRequests.Add(bulkQuote);

            // Add Admin Notification
            var notification = new Notification
            {
                Title = "New Bulk Quote Request",
                Message = $"Bulk quote request received from {name} ({company}) for '{product}' (Qty: {qty}). Mobile: {mobile}",
                Type = "BulkQuote",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            // Send Email Intimation to Admin
            string emailSubject = $"[BULK QUOTE] New Bulk Quote Request from {company} - {name}";
            string emailBody = $@"
            <div style='font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 650px; border: 1px solid #e0e0e0; border-radius: 8px;'>
                <div style='background-color: #00529B; color: #ffffff; padding: 16px; border-radius: 6px 6px 0 0; text-align: center;'>
                    <h2 style='margin: 0;'>New Bulk Quote Request</h2>
                    <p style='margin: 5px 0 0 0; font-size: 14px;'>B2B / Project Requirement Submission</p>
                </div>
                <div style='padding: 20px;'>
                    <table style='width: 100%; border-collapse: collapse;'>
                        <tr><td style='padding: 8px; font-weight: bold; width: 35%; border-bottom: 1px solid #eee;'>Client Name:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{name}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Company Name:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{company}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>GSTIN:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{(string.IsNullOrEmpty(gstin) ? "N/A" : gstin)}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Mobile:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{mobile}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Email:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{email}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Project Location:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{location}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Product:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{product}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Quantity:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{qty}</td></tr>
                    </table>
                    <div style='margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #00529B; border-radius: 4px;'>
                        <strong>Requirement / Specifications:</strong>
                        <p style='margin: 8px 0 0 0; white-space: pre-wrap;'>{requirementText}</p>
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
                message = "Bulk quote request submitted successfully. Our team will contact you shortly.",
                id = bulkQuote.Id
            });
        }

        // ==========================================
        // 2. TALK TO OUR TEAM / CONTACT US API
        // POST: api/Enquiry/contact-us
        // Aliases: api/Contact, api/Support/contact-us
        // ==========================================
        [HttpPost("contact-us")]
        [HttpPost("/api/Contact")]
        [HttpPost("/api/Support/contact-us")]
        public async Task<IActionResult> ContactUs([FromBody] ContactUsRequestDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new { success = false, message = "Payload is required." });
            }

            var name = dto.Name?.Trim();
            var mobile = dto.Mobile?.Trim();
            var email = dto.Email?.Trim();
            var company = dto.Company?.Trim();
            var enquiryType = !string.IsNullOrWhiteSpace(dto.EnquiryType) ? dto.EnquiryType.Trim() : "General";
            var messageText = dto.Message?.Trim();

            if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(mobile) || 
                string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(messageText))
            {
                return BadRequest(new { success = false, message = "Name, Mobile, Email, and Message are required." });
            }

            var contactReq = new ContactUsRequest
            {
                Name = name,
                Mobile = mobile,
                Email = email,
                Company = company,
                EnquiryType = enquiryType,
                Message = messageText,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.ContactUsRequests.Add(contactReq);

            // Create Support Ticket as well
            var ticket = new SupportTicket
            {
                Name = name,
                Email = email,
                Phone = mobile,
                Subject = $"[{enquiryType}] Contact Us Enquiry from {name}",
                Message = messageText,
                SourceType = "ContactUs",
                Status = "Open",
                CreatedAt = DateTime.UtcNow
            };
            _context.SupportTickets.Add(ticket);

            // Add Admin Notification
            var notification = new Notification
            {
                Title = "New Contact Us Message",
                Message = $"Contact message from {name} ({email}). Type: {enquiryType}. Mobile: {mobile}",
                Type = "ContactUs",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            // Send Email Intimation to Admin
            string emailSubject = $"[CONTACT US] New {enquiryType} Enquiry from {name}";
            string emailBody = $@"
            <div style='font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 650px; border: 1px solid #e0e0e0; border-radius: 8px;'>
                <div style='background-color: #00529B; color: #ffffff; padding: 16px; border-radius: 6px 6px 0 0; text-align: center;'>
                    <h2 style='margin: 0;'>Talk to Our Team - Contact Enquiry</h2>
                </div>
                <div style='padding: 20px;'>
                    <table style='width: 100%; border-collapse: collapse;'>
                        <tr><td style='padding: 8px; font-weight: bold; width: 35%; border-bottom: 1px solid #eee;'>Full Name:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{name}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Company:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{(string.IsNullOrEmpty(company) ? "N/A" : company)}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Mobile:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{mobile}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Email:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{email}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Enquiry Type:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{enquiryType}</td></tr>
                    </table>
                    <div style='margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #00529B; border-radius: 4px;'>
                        <strong>Message:</strong>
                        <p style='margin: 8px 0 0 0; white-space: pre-wrap;'>{messageText}</p>
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
                message = "Your message has been submitted successfully. Our team will get back to you soon.",
                id = contactReq.Id
            });
        }

        // ==========================================
        // 3. PRODUCT ENQUIRY API (Modal Form)
        // POST: api/Enquiry/product
        // Aliases: api/ProductEnquiry
        // ==========================================
        [HttpPost("product")]
        [HttpPost("/api/ProductEnquiry")]
        [HttpPost("product-enquiry")]
        public async Task<IActionResult> SubmitProductEnquiry([FromBody] ProductEnquiryDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new { success = false, message = "Payload is required." });
            }

            var product = !string.IsNullOrWhiteSpace(dto.Product) ? dto.Product.Trim() : dto.ProductName?.Trim();
            var name = dto.Name?.Trim();
            var mobile = !string.IsNullOrWhiteSpace(dto.MobileNumber) ? dto.MobileNumber.Trim() : dto.Mobile?.Trim();
            var email = dto.Email?.Trim();

            if (string.IsNullOrWhiteSpace(product) || string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(mobile))
            {
                return BadRequest(new { success = false, message = "Product Name, Client Name, and Mobile Number are required." });
            }

            var enquiry = new ProductEnquiry
            {
                Product = product,
                Name = name,
                MobileNumber = mobile,
                Email = email,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.ProductEnquiries.Add(enquiry);

            // Add Admin Notification
            var notification = new Notification
            {
                Title = "New Product Enquiry",
                Message = $"Product enquiry received from {name} for '{product}'. Mobile: {mobile}",
                Type = "ProductEnquiry",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            // Send Email Intimation to Admin
            string emailSubject = $"[PRODUCT ENQUIRY] Enquiry for {product} from {name}";
            string emailBody = $@"
            <div style='font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 650px; border: 1px solid #e0e0e0; border-radius: 8px;'>
                <div style='background-color: #00529B; color: #ffffff; padding: 16px; border-radius: 6px 6px 0 0; text-align: center;'>
                    <h2 style='margin: 0;'>New Product Enquiry</h2>
                </div>
                <div style='padding: 20px;'>
                    <table style='width: 100%; border-collapse: collapse;'>
                        <tr><td style='padding: 8px; font-weight: bold; width: 35%; border-bottom: 1px solid #eee;'>Product Requested:</td><td style='padding: 8px; border-bottom: 1px solid #eee; color: #00529B; font-weight: bold;'>{product}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Client Name:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{name}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Mobile Number:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{mobile}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Email Address:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{(string.IsNullOrEmpty(email) ? "N/A" : email)}</td></tr>
                    </table>
                </div>
                <div style='background-color: #f4f4f4; padding: 12px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 6px 6px;'>
                    Honeywell Industrial & Commercial Admin Portal
                </div>
            </div>";

            await _emailService.SendAdminNotificationEmailAsync(emailSubject, emailBody);

            return Ok(new
            {
                success = true,
                message = "Product enquiry submitted successfully. We will call you back shortly.",
                id = enquiry.Id
            });
        }

        // ==========================================
        // 4. ADMIN GET LISTING ENDPOINTS
        // ==========================================
        [HttpGet("bulk-quotes")]
        public async Task<IActionResult> GetBulkQuotes()
        {
            var quotes = await _context.BulkQuoteRequests.OrderByDescending(q => q.CreatedAt).ToListAsync();
            return Ok(quotes);
        }

        [HttpGet("contact-us")]
        public async Task<IActionResult> GetContactUsRequests()
        {
            var requests = await _context.ContactUsRequests.OrderByDescending(c => c.CreatedAt).ToListAsync();
            return Ok(requests);
        }

        [HttpGet("product-enquiries")]
        public async Task<IActionResult> GetProductEnquiries()
        {
            var enquiries = await _context.ProductEnquiries.OrderByDescending(p => p.CreatedAt).ToListAsync();
            return Ok(enquiries);
        }
    }
}
