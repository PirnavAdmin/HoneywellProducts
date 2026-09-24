using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Honeywell.Data;
using Honeywell.Models;

namespace Honeywell.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SettingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. Contact Card Settings
        // GET: api/Settings/contact-card
        [HttpGet("contact-card")]
        [HttpGet("contactcard")]
        public async Task<IActionResult> GetContactCard()
        {
            var item = await _context.SystemConfigs.FirstOrDefaultAsync(c => c.Key == "contact_card");
            if (item == null || string.IsNullOrWhiteSpace(item.JsonValue))
            {
                return Ok(new
                {
                    businessName = "Honeywell Solutions",
                    supportEmail = "",
                    contactPhone = "",
                    alternatePhone = "",
                    workingHours = "",
                    address = "",
                    googleMapsUrl = ""
                });
            }

            return Ok(System.Text.Json.JsonSerializer.Deserialize<object>(item.JsonValue));
        }

        // PUT/POST: api/Settings/contact-card
        [HttpPut("contact-card")]
        [HttpPost("contact-card")]
        [HttpPut("contactcard")]
        [HttpPost("contactcard")]
        public async Task<IActionResult> UpdateContactCard([FromBody] object data)
        {
            if (data == null)
            {
                return BadRequest(new { success = false, message = "Payload is required." });
            }

            var item = await _context.SystemConfigs.FirstOrDefaultAsync(c => c.Key == "contact_card");
            if (item == null)
            {
                item = new SystemConfig { Key = "contact_card" };
                _context.SystemConfigs.Add(item);
            }

            item.JsonValue = System.Text.Json.JsonSerializer.Serialize(data);
            item.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Contact card settings saved successfully.",
                data = System.Text.Json.JsonSerializer.Deserialize<object>(item.JsonValue)
            });
        }

        // 2. Footer Config Settings
        // GET: api/Settings/footer
        [HttpGet("footer")]
        public async Task<IActionResult> GetFooterConfig()
        {
            var item = await _context.SystemConfigs.FirstOrDefaultAsync(c => c.Key == "footer_config");
            if (item == null || string.IsNullOrWhiteSpace(item.JsonValue))
            {
                return Ok(new
                {
                    copyrightText = "© 2026 Honeywell International Inc. All rights reserved.",
                    aboutSummary = "",
                    privacyPolicyUrl = "/privacy-policy",
                    termsUrl = "/terms-and-conditions",
                    cookiePolicyUrl = "/cookie-policy",
                    warrantyPolicyUrl = "/warranty-policy",
                    facebookUrl = "https://facebook.com/honeywell",
                    twitterUrl = "https://twitter.com/honeywell",
                    linkedinUrl = "https://linkedin.com/company/honeywell"
                });
            }

            return Ok(System.Text.Json.JsonSerializer.Deserialize<object>(item.JsonValue));
        }

        // PUT/POST: api/Settings/footer
        [HttpPut("footer")]
        [HttpPost("footer")]
        public async Task<IActionResult> UpdateFooterConfig([FromBody] object data)
        {
            if (data == null)
            {
                return BadRequest(new { success = false, message = "Payload is required." });
            }

            var item = await _context.SystemConfigs.FirstOrDefaultAsync(c => c.Key == "footer_config");
            if (item == null)
            {
                item = new SystemConfig { Key = "footer_config" };
                _context.SystemConfigs.Add(item);
            }

            item.JsonValue = System.Text.Json.JsonSerializer.Serialize(data);
            item.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Footer configuration saved successfully.",
                data = System.Text.Json.JsonSerializer.Deserialize<object>(item.JsonValue)
            });
        }

        // 3. Description Manager Settings
        // GET: api/Settings/description-manager
        [HttpGet("description-manager")]
        [HttpGet("descriptionmanager")]
        public async Task<IActionResult> GetDescriptionManager()
        {
            var item = await _context.SystemConfigs.FirstOrDefaultAsync(c => c.Key == "description_manager");
            if (item == null || string.IsNullOrWhiteSpace(item.JsonValue))
            {
                return Ok(new
                {
                    defaultProductOverview = "High-performance Honeywell scanning engine designed for intensive POS operations and warehouse barcode verification.",
                    technicalSpecsTemplate = "Scanning Technology: 2D Imager\nInterface: USB / Bluetooth 5.0\nOperating Temp: -10°C to 50°C\nDrop Specs: 1.8m to concrete",
                    warrantyTerms = "Includes 3-Year Factory Warranty with optional Honeywell Sentinel Service coverage.",
                    disclaimerText = "Specifications are subject to change without prior notice. Contact sales for custom firmware configurations."
                });
            }

            return Ok(System.Text.Json.JsonSerializer.Deserialize<object>(item.JsonValue));
        }

        // PUT/POST: api/Settings/description-manager
        [HttpPut("description-manager")]
        [HttpPost("description-manager")]
        [HttpPut("descriptionmanager")]
        [HttpPost("descriptionmanager")]
        public async Task<IActionResult> UpdateDescriptionManager([FromBody] object data)
        {
            if (data == null)
            {
                return BadRequest(new { success = false, message = "Payload is required." });
            }

            var item = await _context.SystemConfigs.FirstOrDefaultAsync(c => c.Key == "description_manager");
            if (item == null)
            {
                item = new SystemConfig { Key = "description_manager" };
                _context.SystemConfigs.Add(item);
            }

            item.JsonValue = System.Text.Json.JsonSerializer.Serialize(data);
            item.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Description manager settings saved successfully.",
                data = System.Text.Json.JsonSerializer.Deserialize<object>(item.JsonValue)
            });
        }
    }
}
