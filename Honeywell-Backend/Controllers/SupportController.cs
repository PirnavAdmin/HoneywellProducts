using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Honeywell.Data;
using Honeywell.Models;

using Honeywell.Services.Interfaces;
using Honeywell.Helpers;

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
                    workTimings = config.WorkTimings,
                    supportEmail = config.SupportEmail
                });
            }

            return Ok(new
            {
                supportPhoneNumber = "",
                workTimings = "",
                supportEmail = ""
            });
        }

        // PUT: api/Support/config
        [AuthorizeModule(PermissionAction.Edit, "support", "settings", "tickets")]
        [HttpPut("config")]
        public async Task<IActionResult> UpdateSupportConfig([FromBody] SupportConfig request)
        {
            if (string.IsNullOrEmpty(request.SupportPhoneNumber) || string.IsNullOrEmpty(request.WorkTimings))
            {
                return BadRequest(new { Success = false, Message = "SupportPhoneNumber and WorkTimings are required." });
            }

            var config = await _context.SupportConfigs.FirstOrDefaultAsync();
            if (config == null)
            {
                config = new SupportConfig();
                _context.SupportConfigs.Add(config);
            }

            config.SupportPhoneNumber = request.SupportPhoneNumber;
            config.WorkTimings = request.WorkTimings;
            config.SupportEmail = request.SupportEmail ?? string.Empty;
            config.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { Success = true, Message = "Support config updated successfully.", Data = config });
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
        [AuthorizeModule(PermissionAction.View, "support", "tickets")]
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
                // 1. General & Product Selection
                new 
                {
                    id = 1,
                    category = "General & Product Selection",
                    question = "Are all Honeywell security and surveillance products on this website genuine?",
                    answer = "Yes. All products listed on this platform are authentic Honeywell commercial security and surveillance equipment sourced through verified distribution channels. Each product includes genuine manufacturer serial numbers verifiable via our Warranty Lookup (/warranty) portal.",
                    code = "GEN_AUTHENTICITY"
                },
                new 
                {
                    id = 2,
                    category = "General & Product Selection",
                    question = "How can I choose the right security camera or NVR for my facility?",
                    answer = "You can use our interactive Product Finder (/product-finder) to filter cameras by resolution, form factor (dome, bullet, PTZ, or turret), and environment (indoor/outdoor). You can also use our Product Comparison Tool (/compare) to compare models side-by-side or explore curated Industry Solutions (/solutions).",
                    code = "GEN_SELECTION"
                },
                new 
                {
                    id = 3,
                    category = "General & Product Selection",
                    question = "Can I request a customized quotation for enterprise or bulk orders?",
                    answer = "Yes. Institutional buyers, contractors, and project integrators can request tailored quotes by visiting our Contact & Quote Desk (/contact) or by submitting a bulk request. Our commercial sales desk responds within [Requires Business Confirmation: 1 to 2 business days].",
                    code = "GEN_BULK_QUOTE"
                },
                new 
                {
                    id = 4,
                    category = "General & Product Selection",
                    question = "Do your cameras and NVRs comply with ONVIF and open video standards?",
                    answer = "Most Honeywell commercial IP cameras and Network Video Recorders support ONVIF Profile S, G, and T standards for seamless interoperability with third-party VMS platforms. Please verify specific profile compliance on the individual product datasheet available in our Downloads Center (/downloads).",
                    code = "GEN_ONVIF"
                },
                new 
                {
                    id = 5,
                    category = "General & Product Selection",
                    question = "Where can I view case studies and industry-specific security deployments?",
                    answer = "Detailed architecture blueprints and customer deployments across education, healthcare, banking, retail, and commercial facilities are available on our Solutions (/solutions) and Industries (/industries) pages.",
                    code = "GEN_CASE_STUDIES"
                },

                // 2. CCTV & Surveillance
                new 
                {
                    id = 6,
                    category = "CCTV & Surveillance",
                    question = "What is the difference between IP cameras and HD analog (DVR) systems?",
                    answer = "IP (Network) cameras transmit high-definition digital video over Ethernet cables (PoE) with advanced onboard analytics, remote web management, and direct integration with NVRs. Analog HD systems use coaxial cabling connected to DVRs and are suitable for legacy infrastructure upgrades. Explore our full range of Network IP Cameras (/products?category=ip-camera) and NVRs (/products?category=nvr).",
                    code = "CCTV_IP_VS_ANALOG"
                },
                new 
                {
                    id = 7,
                    category = "CCTV & Surveillance",
                    question = "How do Night Vision and Color Hunter / Low-Light technologies work on Honeywell cameras?",
                    answer = "Honeywell surveillance cameras utilize smart infrared (IR) LEDs for black-and-white night vision in complete darkness (0 Lux), while select low-light models feature wide-aperture lenses and high-sensitivity sensors to deliver vivid full-color video even in dim lighting conditions. Check individual camera specifications on our Product Catalog (/products).",
                    code = "CCTV_NIGHT_VISION"
                },
                new 
                {
                    id = 8,
                    category = "CCTV & Surveillance",
                    question = "What weatherproofing and vandal-resistance ratings do outdoor cameras feature?",
                    answer = "Outdoor Honeywell dome and bullet cameras typically carry IP66 or IP67 ingress protection ratings against dust and heavy rain, and IK10 vandal-resistance ratings for impact protection. Check the specifications tab on the Product Details (/products) page for exact model ratings.",
                    code = "CCTV_WEATHERPROOF"
                },
                new 
                {
                    id = 9,
                    category = "CCTV & Surveillance",
                    question = "How much storage capacity do I need for my NVR/DVR system?",
                    answer = "Storage requirements depend on camera count, resolution (e.g., 2MP, 4MP, 8MP/4K), recording mode (continuous vs. motion-activated), frame rate (FPS), and video compression (H.264 vs. H.265/H.265+ Smart Codec). You can consult our technical advisors via Contact Support (/contact) for sizing calculations.",
                    code = "CCTV_STORAGE"
                },
                new 
                {
                    id = 10,
                    category = "CCTV & Surveillance",
                    question = "Can I monitor my CCTV cameras remotely from a mobile phone or web browser?",
                    answer = "Yes. Honeywell NVRs and standalone IP cameras support remote live streaming and playback through dedicated mobile apps and secure web interfaces, subject to network setup and port forwarding or cloud connectivity. App download links are available in our Software Downloads (/resources/software) hub.",
                    code = "CCTV_REMOTE_VIEW"
                },

                // 3. Downloads & Software
                new 
                {
                    id = 11,
                    category = "Downloads & Software",
                    question = "Where can I download official datasheets, user manuals, and architectural specifications?",
                    answer = "Comprehensive technical documentation, CAD drawings, compliance certificates, and installation manuals can be downloaded directly from our Downloads Center (/downloads) or under the 'Documents' tab on any Product Details (/products) page.",
                    code = "DL_MANUALS"
                },
                new 
                {
                    id = 12,
                    category = "Downloads & Software",
                    question = "Where can I download Video Management Software (VMS) and Device Search tools?",
                    answer = "Central management software (CMS/VMS), camera discovery and search utilities, IP configuration tools, and player utilities are hosted on our dedicated Software Downloads (/resources/software) hub.",
                    code = "DL_VMS_TOOLS"
                },
                new 
                {
                    id = 13,
                    category = "Downloads & Software",
                    question = "How do I obtain the latest firmware updates for my security cameras and recorders?",
                    answer = "Device firmware binaries are published on the Downloads Center (/downloads) under the Firmware section. Always verify your device's exact hardware revision and model number before applying firmware updates.",
                    code = "DL_FIRMWARE"
                },
                new 
                {
                    id = 14,
                    category = "Downloads & Software",
                    question = "Do I need a software license to use Honeywell Video Management client software?",
                    answer = "Basic device discovery and standard viewing utilities are provided complimentary with hardware purchase. Advanced multi-site VMS editions and AI analytics packages may require commercial licensing [Requires Business Confirmation: License tiers and activation policies subject to corporate agreement].",
                    code = "DL_LICENSING"
                },
                new 
                {
                    id = 15,
                    category = "Downloads & Software",
                    question = "What operating systems are supported by Honeywell surveillance management software?",
                    answer = "Most desktop configuration utilities and client software support 64-bit Windows 10/11 and Windows Server environments. Mobile monitoring apps are available for Android and iOS. Check the system requirements listed in each download package on our Software Downloads (/resources/software) page.",
                    code = "DL_OS_SUPPORT"
                },

                // 4. Installation & Technical Support
                new 
                {
                    id = 16,
                    category = "Installation & Technical Support",
                    question = "Does this website provide on-site installation and cabling services?",
                    answer = "Direct physical installation is not automatically bundled with e-commerce purchases unless specified in a commercial turnkey contract. Installations are typically performed by authorized system integrators and certified partner networks [Requires Business Confirmation: On-site installation availability varies by region and project scale]. For recommendations, submit an inquiry via our Contact Page (/contact).",
                    code = "TECH_INSTALLATION"
                },
                new 
                {
                    id = 17,
                    category = "Installation & Technical Support",
                    question = "How do I submit a hardware repair or technical service ticket?",
                    answer = "You can submit an online service request directly via our Service & Repair Request (/service-request) portal. Provide your product model, serial number, and a detailed description of the issue to receive a trackable support ticket number.",
                    code = "TECH_SERVICE_TICKET"
                },
                new 
                {
                    id = 18,
                    category = "Installation & Technical Support",
                    question = "What is the expected response time for technical support tickets?",
                    answer = "Our technical assistance desk aims to review submitted tickets within [Requires Business Confirmation: 4 to 8 business hours during standard operational timings]. Emergency enterprise support is governed by project-specific SLAs.",
                    code = "TECH_RESPONSE_TIME"
                },
                new 
                {
                    id = 19,
                    category = "Installation & Technical Support",
                    question = "How can I reset an IP camera or NVR if the administrator password is forgotten?",
                    answer = "Most models have a physical hardware reset button located near the SD card slot or inside the camera housing that restores factory defaults when held for 10-15 seconds while powered. For enterprise units without physical buttons, please submit a ticket on our Service Request (/service-request) page with proof of ownership for a secure recovery key.",
                    code = "TECH_PASSWORD_RESET"
                },
                new 
                {
                    id = 20,
                    category = "Installation & Technical Support",
                    question = "How do I calculate the PoE power budget for my security camera network switch?",
                    answer = "Calculate total power consumption by summing the maximum wattage ratings of all connected IP cameras (typically 6W to 12W for standard IR cameras; up to 30W-60W for high-power PTZ cameras with heaters). Ensure your PoE switch power budget exceeds total camera draw by at least 20%. Consult our Downloads Center (/downloads) for camera power specifications.",
                    code = "TECH_POE_BUDGET"
                },

                // 5. Warranty & Returns
                new 
                {
                    id = 21,
                    category = "Warranty & Returns",
                    question = "How long is the manufacturer warranty on Honeywell surveillance equipment?",
                    answer = "Hardware warranty durations vary by product category [Requires Business Confirmation: Typically 2 to 3 Years on IP Cameras and NVRs, and 1 Year on accessories and power supplies]. Review full coverage details in our official Warranty Policy (/warranty-policy) or check your device status using the Warranty Lookup Tool (/warranty).",
                    code = "WAR_DURATION"
                },
                new 
                {
                    id = 22,
                    category = "Warranty & Returns",
                    question = "What is the return and replacement window for defective or damaged items?",
                    answer = "Eligible products with transit damage, manufacturing defects, or Dead-on-Arrival (DOA) conditions must be reported within [Requires Business Confirmation: 7 calendar days from delivery]. Returned units must include original packaging, accessories, and invoice tags. Details are specified in our Return & Refund Policy (/return-refund-policy).",
                    code = "WAR_RETURN_WINDOW"
                },
                new 
                {
                    id = 23,
                    category = "Warranty & Returns",
                    question = "What damages or issues are excluded from warranty coverage?",
                    answer = "Warranty does not cover physical damage, lightning or electrical power surges, liquid submersion (unless rated), unauthorized tampering, incorrect voltage input, or unauthorized firmware modifications. Refer to Section 3 of our Warranty Policy (/warranty-policy) for complete exclusions.",
                    code = "WAR_EXCLUSIONS"
                },
                new 
                {
                    id = 24,
                    category = "Warranty & Returns",
                    question = "How are refunds processed and what is the typical processing timeframe?",
                    answer = "Approved refunds are initiated after technical inspection of the returned hardware at our facility. Credits are refunded to the original payment method within [Requires Business Confirmation: 5 to 7 business days from RMA inspection approval], as detailed in our Return & Refund Policy (/return-refund-policy).",
                    code = "WAR_REFUND_TIME"
                },
                new 
                {
                    id = 25,
                    category = "Warranty & Returns",
                    question = "How do I obtain a Return Merchandise Authorization (RMA) number?",
                    answer = "Submit your RMA claim through the Warranty & Returns Portal (/warranty) or open a ticket on the Service Request (/service-request) page. Once verified by our support engineering desk, an official RMA authorization code and return instructions will be emailed to you.",
                    code = "WAR_RMA_PROCESS"
                },

                // 6. Orders & Delivery
                new 
                {
                    id = 26,
                    category = "Orders & Delivery",
                    question = "What payment methods are accepted on this e-commerce storefront?",
                    answer = "We accept online payments via authorized commercial credit/debit cards, Net Banking, UPI, and approved payment gateways. For corporate purchase orders, direct NEFT/RTGS bank transfers are available upon proforma invoice generation. Full terms are outlined in our Terms & Conditions (/terms-and-conditions).",
                    code = "ORD_PAYMENT_METHODS"
                },
                new 
                {
                    id = 27,
                    category = "Orders & Delivery",
                    question = "How long does order dispatch and delivery usually take?",
                    answer = "In-stock security equipment is processed and dispatched within [Requires Business Confirmation: 24 to 48 business hours]. Delivery across metropolitan and Tier-1 regions typically takes [Requires Business Confirmation: 3 to 5 business days], while regional destinations may require [Requires Business Confirmation: 5 to 7 business days]. Review our Shipping & Delivery Policy (/shipping-delivery-policy).",
                    code = "ORD_DISPATCH_TIME"
                },
                new 
                {
                    id = 28,
                    category = "Orders & Delivery",
                    question = "How can I track my order once it has been dispatched?",
                    answer = "Once your consignment is handed over to our insured logistics partner, tracking numbers are updated in your Customer Account (/account/orders) and live transit updates can be viewed on our Order Tracking (/order-tracking) page.",
                    code = "ORD_TRACKING"
                },
                new 
                {
                    id = 29,
                    category = "Orders & Delivery",
                    question = "Can I cancel or modify an order after it has been placed?",
                    answer = "Orders can be cancelled prior to warehouse dispatch by visiting your Customer Orders (/account/orders) page or by contacting customer assistance. Once an order is handed over to courier carriers, cancellation is subject to our Cancellation Policy (/cancellation-policy).",
                    code = "ORD_CANCELLATION"
                },
                new 
                {
                    id = 30,
                    category = "Orders & Delivery",
                    question = "Are all purchases accompanied by a GST-compliant tax invoice?",
                    answer = "Yes. Every order includes a formal GST-compliant commercial tax invoice displaying HSN codes, IGST/CGST/SGST breakdowns, and your registered company GSTIN when entered during Checkout (/checkout). Invoices can also be re-downloaded from your Customer Account (/account/orders).",
                    code = "ORD_GST_INVOICE"
                },

                // 7. Business & Distributor
                new 
                {
                    id = 31,
                    category = "Business & Distributor",
                    question = "How can system integrators, resellers, or dealers register as authorized partners?",
                    answer = "System integrators, security contractors, and dealers can apply for partner registration by visiting our Partner Benefits (/partner-benefits) page and completing the channel onboarding form. Authorized partners gain access to dealer pricing, dedicated account managers, and priority inventory.",
                    code = "BIZ_PARTNER_REG"
                },
                new 
                {
                    id = 32,
                    category = "Business & Distributor",
                    question = "How do registered partners access distributor pricing and order placement?",
                    answer = "Approved partners can log into their dedicated B2B environment through the Partner Login Portal (/partner/login) to view wholesale discount schedules, credit limits, and submit institutional purchase orders via the Partner Dashboard (/partner/dashboard).",
                    code = "BIZ_DISTRIBUTOR_PRICING"
                },
                new 
                {
                    id = 33,
                    category = "Business & Distributor",
                    question = "Can your engineering team provide project bid specifications and tenders support?",
                    answer = "Yes. We assist government and commercial contractors with Honeywell product specification compliance sheets, tender qualification documentation, and architect/engineer (A&E) specification packages. Submit your tender requirements via our Contact Us (/contact) desk.",
                    code = "BIZ_TENDER_SUPPORT"
                },
                new 
                {
                    id = 34,
                    category = "Business & Distributor",
                    question = "What credit terms or credit periods are available for corporate accounts?",
                    answer = "Revolving credit terms and net payment facilities (e.g., Net 30 days) are evaluated on a case-by-case basis for verified institutional clients with established annual volume [Requires Business Confirmation: Commercial credit terms subject to credit appraisal and corporate approval]. Inquire with our Business Desk (/business).",
                    code = "BIZ_CREDIT_TERMS"
                }
            };

            if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                var cleanCat = category.Trim().ToLower();
                var filtered = faqs.Where(f => f.category.ToLower() == cleanCat || f.category.ToLower().Contains(cleanCat)).ToList();
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
