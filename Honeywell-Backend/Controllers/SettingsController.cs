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
                    tagline = "Smart technology. Stronger protection. Discover security, surveillance and solar solutions.",
                    quickLinks = new[]
                    {
                        new { label = "About Us", url = "/about" },
                        new { label = "Products", url = "/catalog" },
                        new { label = "Software Downloads", url = "/resources/software" },
                        new { label = "Contact Support", url = "/support" }
                    },
                    socialLinks = new
                    {
                        facebook = "https://facebook.com/honeywell",
                        twitter = "https://twitter.com/honeywell",
                        linkedin = "https://linkedin.com/company/honeywell",
                        youtube = "https://youtube.com/honeywell"
                    }
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
                    defaultWarrantyTemplate = "1-Year Manufacturer Warranty included. Terms & Conditions apply.",
                    defaultReturnPolicyTemplate = "7-Day Easy Returns & Replacements for defective items.",
                    defaultShippingNotice = "Free shipping on orders above ₹1000 across India.",
                    disclaimerText = "Specifications are subject to change without prior notice."
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
