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

        // 4. Product Price Visibility Settings (Mode A: Catalogue Mode / Mode B: E-Commerce Mode)
        // GET: api/Settings/price-visibility
        [HttpGet("price-visibility")]
        [HttpGet("pricevisibility")]
        [HttpGet("pricing-mode")]
        public async Task<IActionResult> GetPriceVisibility()
        {
            var item = await _context.SystemConfigs.FirstOrDefaultAsync(c => c.Key == "product_price_visibility" || c.Key == "price_visibility");
            bool isEnabled = true;

            if (item != null && !string.IsNullOrWhiteSpace(item.JsonValue))
            {
                try
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(item.JsonValue);
                    var root = doc.RootElement;
                    if (root.ValueKind == System.Text.Json.JsonValueKind.True) isEnabled = true;
                    else if (root.ValueKind == System.Text.Json.JsonValueKind.False) isEnabled = false;
                    else if (root.ValueKind == System.Text.Json.JsonValueKind.Object)
                    {
                        if (root.TryGetProperty("enabled", out var prop) || root.TryGetProperty("Enabled", out prop) ||
                            root.TryGetProperty("priceVisibility", out prop) || root.TryGetProperty("PriceVisibility", out prop))
                        {
                            if (prop.ValueKind == System.Text.Json.JsonValueKind.True) isEnabled = true;
                            else if (prop.ValueKind == System.Text.Json.JsonValueKind.False) isEnabled = false;
                        }
                    }
                }
                catch
                {
                    if (bool.TryParse(item.JsonValue, out var parsed)) isEnabled = parsed;
                }
            }

            return Ok(new
            {
                success = true,
                enabled = isEnabled,
                priceVisibility = isEnabled,
                mode = isEnabled ? "Ecommerce" : "Catalogue",
                modeLabel = isEnabled ? "Full E-Commerce Mode" : "Catalogue & Enquiry Mode"
            });
        }

        // PUT/POST: api/Settings/price-visibility
        [HttpPut("price-visibility")]
        [HttpPost("price-visibility")]
        [HttpPut("pricevisibility")]
        [HttpPost("pricevisibility")]
        [HttpPut("pricing-mode")]
        [HttpPost("pricing-mode")]
        public async Task<IActionResult> UpdatePriceVisibility([FromBody] System.Text.Json.JsonElement payload)
        {
            bool isEnabled = true;
            try
            {
                if (payload.ValueKind == System.Text.Json.JsonValueKind.True) isEnabled = true;
                else if (payload.ValueKind == System.Text.Json.JsonValueKind.False) isEnabled = false;
                else if (payload.ValueKind == System.Text.Json.JsonValueKind.Object)
                {
                    if (payload.TryGetProperty("enabled", out var prop) || payload.TryGetProperty("Enabled", out prop) ||
                        payload.TryGetProperty("priceVisibility", out prop) || payload.TryGetProperty("PriceVisibility", out prop))
                    {
                        if (prop.ValueKind == System.Text.Json.JsonValueKind.True) isEnabled = true;
                        else if (prop.ValueKind == System.Text.Json.JsonValueKind.False) isEnabled = false;
                        else if (prop.ValueKind == System.Text.Json.JsonValueKind.String && bool.TryParse(prop.GetString(), out var pBool)) isEnabled = pBool;
                    }
                }
                else if (payload.ValueKind == System.Text.Json.JsonValueKind.String && bool.TryParse(payload.GetString(), out var sBool))
                {
                    isEnabled = sBool;
                }
            }
            catch
            {
                isEnabled = true;
            }

            var item = await _context.SystemConfigs.FirstOrDefaultAsync(c => c.Key == "product_price_visibility" || c.Key == "price_visibility");
            if (item == null)
            {
                item = new SystemConfig { Key = "product_price_visibility" };
                _context.SystemConfigs.Add(item);
            }
            else
            {
                item.Key = "product_price_visibility";
            }

            var serializedObj = new
            {
                enabled = isEnabled,
                priceVisibility = isEnabled,
                updatedAt = DateTime.UtcNow
            };

            item.JsonValue = System.Text.Json.JsonSerializer.Serialize(serializedObj);
            item.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"Product Price Visibility updated to {(isEnabled ? "ON (E-Commerce Mode)" : "OFF (Catalogue Mode)")}.",
                enabled = isEnabled,
                priceVisibility = isEnabled,
                mode = isEnabled ? "Ecommerce" : "Catalogue",
                modeLabel = isEnabled ? "Full E-Commerce Mode" : "Catalogue & Enquiry Mode"
            });
        }
    }
}
