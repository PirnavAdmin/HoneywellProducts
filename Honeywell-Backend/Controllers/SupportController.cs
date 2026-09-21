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
    public class SupportController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;

        public SupportController(ApplicationDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        public class SupportConfigRequestDto
        {
            public string? SupportPhoneNumber { get; set; }
            public string? Phone { get; set; }
            public string? SupportPhone { get; set; }
            public string? WorkTimings { get; set; }
            public string? Timings { get; set; }
            public string? SupportEmail { get; set; }
            public string? Email { get; set; }
        }

        // GET: api/Support/config
        [HttpGet("config")]
        public async Task<IActionResult> GetSupportConfig()
        {
            var config = await _context.SupportConfigs.FirstOrDefaultAsync();
            if (config != null)
            {
                return Ok(new
                {
                    supportPhoneNumber = config.SupportPhoneNumber,
                    SupportPhoneNumber = config.SupportPhoneNumber,
                    phone = config.SupportPhoneNumber,
                    workTimings = config.WorkTimings,
                    WorkTimings = config.WorkTimings,
                    supportEmail = config.SupportEmail,
                    SupportEmail = config.SupportEmail,
                    email = config.SupportEmail
                });
            }

            return Ok(new
            {
                supportPhoneNumber = "+1 (800) 323-0194",
                SupportPhoneNumber = "+1 (800) 323-0194",
                phone = "+1 (800) 323-0194",
                workTimings = "Mon-Sat: 9:00 AM - 6:00 PM",
                WorkTimings = "Mon-Sat: 9:00 AM - 6:00 PM",
                supportEmail = "support@honeywell.com",
                SupportEmail = "support@honeywell.com",
                email = "support@honeywell.com"
            });
        }

        // PUT: api/Support/config
        // POST: api/Support/config
        [HttpPut("config")]
        [HttpPost("config")]
        public async Task<IActionResult> UpdateSupportConfig([FromBody] SupportConfigRequestDto request)
        {
            if (request == null)
            {
                return BadRequest(new { Success = false, Message = "Invalid request payload." });
            }

            var phone = !string.IsNullOrWhiteSpace(request.SupportPhoneNumber) ? request.SupportPhoneNumber :
                        (!string.IsNullOrWhiteSpace(request.Phone) ? request.Phone :
                        (!string.IsNullOrWhiteSpace(request.SupportPhone) ? request.SupportPhone : ""));

            var timings = !string.IsNullOrWhiteSpace(request.WorkTimings) ? request.WorkTimings :
                          (!string.IsNullOrWhiteSpace(request.Timings) ? request.Timings : "Mon-Sat: 9:00 AM - 6:00 PM");

            var email = !string.IsNullOrWhiteSpace(request.SupportEmail) ? request.SupportEmail :
                        (!string.IsNullOrWhiteSpace(request.Email) ? request.Email : "");

            var config = await _context.SupportConfigs.FirstOrDefaultAsync();
            if (config == null)
            {
                config = new SupportConfig();
                _context.SupportConfigs.Add(config);
            }

            if (!string.IsNullOrWhiteSpace(phone))
            {
                config.SupportPhoneNumber = phone.Trim();
            }
            if (!string.IsNullOrWhiteSpace(timings))
            {
                config.WorkTimings = timings.Trim();
            }
            if (!string.IsNullOrWhiteSpace(email))
            {
                config.SupportEmail = email.Trim();
            }
            config.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new
            {
                Success = true,
                Message = "Support config updated successfully.",
                Data = new
                {
                    supportPhoneNumber = config.SupportPhoneNumber,
                    SupportPhoneNumber = config.SupportPhoneNumber,
                    workTimings = config.WorkTimings,
                    WorkTimings = config.WorkTimings,
                    supportEmail = config.SupportEmail,
                    SupportEmail = config.SupportEmail
                }
            });
        }

        public class BotChatRequest
        {
            public string Message { get; set; } = string.Empty;
        }

        // POST: api/Support/bot/chat
        [HttpPost("bot/chat")]
        public async Task<IActionResult> BotChat([FromBody] BotChatRequest request)
        {
            if (string.IsNullOrEmpty(request.Message))
            {
                return BadRequest(new { Success = false, Message = "Message is required." });
            }

            string text = request.Message.ToLower();
            string reply = "";
            var suggestedLinks = new List<object>();

            // 1. Check Tracking Policy Keywords
            if (text.Contains("track") || text.Contains("where is my order") || text.Contains("tracking") || text.Contains("status"))
            {
                reply = "To track your order, enter your Order ID / Reference Code in our tracking page. Orders are shipped within 24 hours of payment verification. Shipped orders generally take 3-5 business days to reach your location.";
                suggestedLinks.Add(new { title = "Tracking Policy", path = "/support/tracking-policy", code = "TRACK_POLICY" });
            }
            // 2. Check Return & Refund Keywords
            else if (text.Contains("return") || text.Contains("refund") || text.Contains("cancel") || text.Contains("money back") || text.Contains("replace"))
            {
                reply = "Our Return & Refund policy allows you to return products within 7 days of delivery if they are unused, in original packaging, and contain all tags. Refunds are processed to the original payment source within 5-7 working days after receipt inspection.";
                suggestedLinks.Add(new { title = "Return & Refund", path = "/support/return-refund", code = "RETURN_REFUND" });
            }
            // 3. Check Warranty Keywords
            else if (text.Contains("warranty") || text.Contains("damage") || text.Contains("broken") || text.Contains("repair") || text.Contains("claim") || text.Contains("defect"))
            {
                reply = "All Shyam Agro tools come with a standard 12-month manufacturer warranty covering technical and manufacturing defects. To file a claim, please submit a clear video/photo of the defect along with your tax invoice receipt to our support ticket system.";
                suggestedLinks.Add(new { title = "Warranty Claim", path = "/support/warranty-claim", code = "WARRANTY_CLAIM" });
            }
            // 4. Check Invoice Keywords
            else if (text.Contains("invoice") || text.Contains("bill") || text.Contains("receipt") || text.Contains("download"))
            {
                reply = "You can download the PDF invoice for any successfully verified order by visiting your Account Dashboard, selecting the order history tab, and clicking the 'Download Invoice' button next to the order record.";
                suggestedLinks.Add(new { title = "Download Invoice", path = "/support/download-invoice", code = "DOWNLOAD_INVOICE" });
            }
            // 5. Check Greetings
            else if (text.Contains("hello") || text.Contains("hi") || text.Contains("hey") || text.Contains("greeting"))
            {
                reply = "Hello! I am your Shyam Agro assistant. How can I help you today? You can ask me about order tracking, return policies, warranty claims, or downloading invoices.";
            }
            // 6. Fallback response
            else
            {
                // Dynamic phone retrieval for fallback reply
                var config = await _context.SupportConfigs.FirstOrDefaultAsync();
                string phone = config?.SupportPhoneNumber ?? "";
                string email = config?.SupportEmail ?? "";

                reply = $"I'm sorry, I couldn't find a direct answer to your question. Would you like to check our quick links (Tracking Policy, Return & Refund, Warranty Claim) or speak directly to our support team at {phone} or email us at {email}?";
            }

            return Ok(new
            {
                success = true,
                reply = reply,
                suggestedLinks = suggestedLinks
            });
        }

        public class TicketRequest
        {
            public string Name { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string Phone { get; set; } = string.Empty;
            public string Subject { get; set; } = string.Empty;
            public string Message { get; set; } = string.Empty;
        }

        // POST: api/Support/ticket
        [HttpPost("ticket")]
        public async Task<IActionResult> CreateTicket([FromBody] TicketRequest request)
        {
            if (string.IsNullOrEmpty(request.Name) || string.IsNullOrEmpty(request.Email) || 
                string.IsNullOrEmpty(request.Subject) || string.IsNullOrEmpty(request.Message))
            {
                return BadRequest(new { Success = false, Message = "Name, Email, Subject, and Message are required." });
            }

            var ticket = new SupportTicket
            {
                Name = request.Name,
                Email = request.Email,
                Phone = request.Phone,
                Subject = request.Subject,
                Message = request.Message,
                Status = "Open",
                CreatedAt = DateTime.UtcNow
            };

            _context.SupportTickets.Add(ticket);

            // Add notification trigger for Admin
            var notification = new Notification
            {
                Title = "New Support Ticket",
                Message = $"Support ticket regarding '{request.Subject}' submitted by {request.Name} ({request.Email}).",
                Type = "SupportTicket",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            // Send Email Intimation to Admin
            string emailSubject = $"[SUPPORT TICKET] New Ticket #{ticket.Id} from {request.Name}: {request.Subject}";
            string emailBody = $@"
            <div style='font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 650px; border: 1px solid #e0e0e0; border-radius: 8px;'>
                <div style='background-color: #00529B; color: #ffffff; padding: 16px; border-radius: 6px 6px 0 0; text-align: center;'>
                    <h2 style='margin: 0;'>New Support Ticket Submitted</h2>
                    <p style='margin: 5px 0 0 0; font-size: 14px;'>Ticket ID: #{ticket.Id}</p>
                </div>
                <div style='padding: 20px;'>
                    <table style='width: 100%; border-collapse: collapse;'>
                        <tr><td style='padding: 8px; font-weight: bold; width: 35%; border-bottom: 1px solid #eee;'>Customer Name:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{request.Name}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Email:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{request.Email}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Phone:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{(string.IsNullOrEmpty(request.Phone) ? "N/A" : request.Phone)}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Subject:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{request.Subject}</td></tr>
                    </table>
                    <div style='margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #00529B; border-radius: 4px;'>
                        <strong>Ticket Description / Issue:</strong>
                        <p style='margin: 8px 0 0 0; white-space: pre-wrap;'>{request.Message}</p>
                    </div>
                </div>
                <div style='background-color: #f4f4f4; padding: 12px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 6px 6px;'>
                    Honeywell / Shyam Agro Tools Admin Portal
                </div>
            </div>";

            await _emailService.SendAdminNotificationEmailAsync(emailSubject, emailBody);

            return Ok(new
            {
                Success = true,
                Message = "Your support ticket was submitted successfully. Support team will contact you shortly.",
                TicketId = ticket.Id
            });
        }

        // GET: api/Support/ticket
        [HttpGet("ticket")]
        public async Task<IActionResult> GetTickets()
        {
            var tickets = await _context.SupportTickets.OrderByDescending(t => t.CreatedAt).ToListAsync();
            return Ok(tickets);
        }

        // ====================================================
        // 1. SERVICE & REPAIR REQUEST API
        // POST: api/Support/service-request
        // Aliases: api/ServiceRequest, api/Support/service
        // ====================================================
        [HttpPost("service-request")]
        [HttpPost("service")]
        [HttpPost("/api/ServiceRequest")]
        public async Task<IActionResult> CreateServiceRequest([FromBody] ServiceRequestDto request)
        {
            if (request == null)
            {
                return BadRequest(new { success = false, message = "Payload is required." });
            }

            var name = !string.IsNullOrWhiteSpace(request.FullName) ? request.FullName.Trim() : request.Name?.Trim();
            var mobile = !string.IsNullOrWhiteSpace(request.Mobile) ? request.Mobile.Trim() : request.MobileNumber?.Trim();
            var email = request.Email?.Trim();
            var productModel = !string.IsNullOrWhiteSpace(request.ProductModel) ? request.ProductModel.Trim() : request.ProductName?.Trim();
            var serialNumber = request.SerialNumber?.Trim();
            var orderNumber = request.OrderNumber?.Trim();
            var issueType = !string.IsNullOrWhiteSpace(request.IssueType) ? request.IssueType.Trim() : "Hardware Defect / Faulty Unit";
            var problemDescription = !string.IsNullOrWhiteSpace(request.ProblemDescription) ? request.ProblemDescription.Trim() : request.Description?.Trim();

            if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(mobile) || string.IsNullOrWhiteSpace(problemDescription))
            {
                return BadRequest(new { success = false, message = "Full Name, Mobile Number, and Problem Description are required." });
            }

            string ticketCode = $"TCK-SRV-{new Random().Next(10000, 99999)}";
            string subject = $"[SERVICE & REPAIR] {issueType} - {(string.IsNullOrEmpty(productModel) ? "Hardware Unit" : productModel)}";

            var ticket = new SupportTicket
            {
                TicketId = ticketCode,
                Name = name,
                Email = string.IsNullOrEmpty(email) ? "no-email@service.com" : email,
                Phone = mobile,
                Subject = subject,
                Message = $"Product Model: {(string.IsNullOrEmpty(productModel) ? "N/A" : productModel)}\nSerial Number: {(string.IsNullOrEmpty(serialNumber) ? "N/A" : serialNumber)}\nOrder Number: {(string.IsNullOrEmpty(orderNumber) ? "N/A" : orderNumber)}\nIssue Type: {issueType}\n\nDescription:\n{problemDescription}",
                SourceType = "ServiceRequest",
                OrderReference = orderNumber,
                Priority = "High",
                Status = "Open",
                CreatedAt = DateTime.UtcNow
            };

            _context.SupportTickets.Add(ticket);

            // Add Admin Notification
            var notification = new Notification
            {
                Title = "New Service & Repair Request",
                Message = $"Technical service ticket {ticketCode} submitted by {name} for model '{productModel}'. Mobile: {mobile}",
                Type = "ServiceRequest",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            // Send Email Intimation to Admin
            string emailSubject = $"[TECHNICAL SERVICE] New Repair Ticket {ticketCode} - {name}";
            string emailBody = $@"
            <div style='font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 650px; border: 1px solid #e0e0e0; border-radius: 8px;'>
                <div style='background-color: #00529B; color: #ffffff; padding: 16px; border-radius: 6px 6px 0 0; text-align: center;'>
                    <h2 style='margin: 0;'>New Service & Repair Request</h2>
                    <p style='margin: 5px 0 0 0; font-size: 14px;'>Ticket ID: {ticketCode}</p>
                </div>
                <div style='padding: 20px;'>
                    <table style='width: 100%; border-collapse: collapse;'>
                        <tr><td style='padding: 8px; font-weight: bold; width: 35%; border-bottom: 1px solid #eee;'>Full Name:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{name}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Mobile Number:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{mobile}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Email Address:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{(string.IsNullOrEmpty(email) ? "N/A" : email)}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Product Model / Name:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{(string.IsNullOrEmpty(productModel) ? "N/A" : productModel)}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Serial Number:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{(string.IsNullOrEmpty(serialNumber) ? "N/A" : serialNumber)}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Order Number:</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>{(string.IsNullOrEmpty(orderNumber) ? "N/A" : orderNumber)}</td></tr>
                        <tr><td style='padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;'>Type of Issue:</td><td style='padding: 8px; border-bottom: 1px solid #eee; color: #D9534F; font-weight: bold;'>{issueType}</td></tr>
                    </table>
                    <div style='margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #00529B; border-radius: 4px;'>
                        <strong>Problem Description:</strong>
                        <p style='margin: 8px 0 0 0; white-space: pre-wrap;'>{problemDescription}</p>
                    </div>
                </div>
                <div style='background-color: #f4f4f4; padding: 12px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 6px 6px;'>
                    Honeywell / Shyam Agro Tools Admin Portal
                </div>
            </div>";

            await _emailService.SendAdminNotificationEmailAsync(emailSubject, emailBody);

            return Ok(new
            {
                success = true,
                message = "Your technical service & repair ticket has been submitted successfully. Support team will contact you shortly.",
                ticketId = ticket.Id,
                ticketCode = ticketCode
            });
        }

        // ====================================================
        // 2. FREQUENTLY ASKED QUESTIONS (FAQS) API
        // GET: api/Support/faqs
        // Aliases: api/Faqs
        // ====================================================
        [HttpGet("faqs")]
        [HttpGet("/api/Faqs")]
        public IActionResult GetFaqs([FromQuery] string? category)
        {
            var faqs = new[]
            {
                new 
                {
                    id = 1,
                    category = "Warranty & Returns",
                    question = "How do I check if my product is eligible for warranty coverage?",
                    answer = "You can verify your hardware warranty status by visiting our Warranty & Returns page (/warranty) and entering your Tax Invoice Order Number (e.g. ORD-31904) or Product Serial Number into the Instant Database Lookup tool.",
                    code = "WARRANTY_ELIGIBILITY"
                },
                new 
                {
                    id = 2,
                    category = "Downloads & Manuals",
                    question = "Where can I download product datasheets and installation manuals?",
                    answer = "Product specifications, technical datasheets, and user installation manuals can be downloaded directly from our Downloads & Documents Hub (/downloads?tab=documents) or by visiting the specific Product Details page under the 'Product Resources' section.",
                    code = "DOWNLOADS_MANUALS"
                },
                new 
                {
                    id = 3,
                    category = "Technical Service",
                    question = "What is the standard response time for a technical service request?",
                    answer = "Our technical support team reviews all submitted Service & Repair Tickets within 2 to 4 business hours. If a hardware inspection or physical repair is required, an RMA pickup authorization number will be issued within 24 hours.",
                    code = "SERVICE_RESPONSE_TIME"
                },
                new 
                {
                    id = 4,
                    category = "Returns & Replacement",
                    question = "How do I request a replacement or return for a damaged item?",
                    answer = "Submit a return request through your Customer Account Dashboard under 'My Orders' -> 'Return / Replace' within 7 days of order delivery. Ensure original packaging and invoice tags are retained.",
                    code = "RETURN_REPLACEMENT"
                },
                new 
                {
                    id = 5,
                    category = "Software & Drivers",
                    question = "Where can I find setup utilities and Windows print drivers?",
                    answer = "All official configuration utilities, firmware update packages, and Windows/macOS drivers are available on our Software Downloads Hub (/resources/software).",
                    code = "SOFTWARE_DRIVERS"
                }
            };

            if (!string.IsNullOrWhiteSpace(category))
            {
                var filtered = faqs.Where(f => f.category.ToLower().Contains(category.Trim().ToLower())).ToList();
                return Ok(filtered);
            }

            return Ok(faqs);
        }

        // ====================================================
        // 3. VIDEO DEMONSTRATION CENTER API
        // GET: api/Support/videos
        // Aliases: api/Videos
        // ====================================================
        [HttpGet("videos")]
        [HttpGet("/api/Videos")]
        public IActionResult GetVideos([FromQuery] string? category, [FromQuery] string? search)
        {
            var videos = new[]
            {
                new
                {
                    id = 1,
                    title = "Honeywell High Definition IP Camera Overview",
                    category = "Product Demos",
                    duration = "3:45",
                    thumbnailUrl = "/uploads/videos/thumbnails/ip_camera_demo.jpg",
                    videoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ",
                    description = "Comprehensive walkthrough of Honeywell 12MP Acusense Darkfighter fixed bullet camera features, night vision capabilities, and IP67 weather resistance."
                },
                new
                {
                    id = 2,
                    title = "Solar Security Camera Installation & Configuration Guide",
                    category = "Installation",
                    duration = "5:20",
                    thumbnailUrl = "/uploads/videos/thumbnails/solar_install.jpg",
                    videoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ",
                    description = "Step-by-step tutorial on mounting off-grid solar panels, connecting battery backup units, and setting up wireless 4G LTE surveillance cameras."
                },
                new
                {
                    id = 3,
                    title = "AI Motion Analytics & Line Crossing Setup Tutorial",
                    category = "Tutorials",
                    duration = "4:10",
                    thumbnailUrl = "/uploads/videos/thumbnails/ai_motion_setup.jpg",
                    videoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ",
                    description = "Learn how to configure perimeter intrusion detection, virtual line crossing rules, and real-time push alert notifications on Honeywell NVRs."
                }
            };

            var queryable = videos.AsQueryable();

            if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                queryable = queryable.Where(v => v.category.Equals(category.Trim(), StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                queryable = queryable.Where(v => v.title.ToLower().Contains(term) || v.description.ToLower().Contains(term));
            }

            return Ok(queryable.ToList());
        }
    }

    public class ServiceRequestDto
    {
        public string? FullName { get; set; }
        public string? Name { get; set; }
        public string? Mobile { get; set; }
        public string? MobileNumber { get; set; }
        public string? Email { get; set; }
        public string? ProductModel { get; set; }
        public string? ProductName { get; set; }
        public string? SerialNumber { get; set; }
        public string? OrderNumber { get; set; }
        public string? IssueType { get; set; }
        public string? ProblemDescription { get; set; }
        public string? Description { get; set; }
    }
}
