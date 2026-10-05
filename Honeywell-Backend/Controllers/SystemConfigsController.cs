using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Honeywell.Data;
using Honeywell.Models;

namespace Honeywell.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Route("api/SystemConfig")]
    public class SystemConfigsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SystemConfigsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. GET: api/SystemConfigs?key=business_hero  (or api/SystemConfig?key=business_hero)
        [HttpGet]
        public async Task<IActionResult> GetConfigs([FromQuery] string? key)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(key))
                {
                    return await GetByKeyInternal(key.Trim());
                }

                // If no key parameter is provided, return all system configs
                var allConfigs = await _context.SystemConfigs.AsNoTracking().ToListAsync();
                var result = allConfigs.Select(c => FormatConfigResponse(c)).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error retrieving system configs: {ex}");
                return StatusCode(500, new { success = false, message = "Error retrieving system configs.", error = ex.Message });
            }
        }

        // 2. GET: api/SystemConfigs/{key}  (e.g., api/SystemConfigs/business_hero)
        [HttpGet("{key}")]
        public async Task<IActionResult> GetByKey(string key)
        {
            if (string.IsNullOrWhiteSpace(key))
            {
                return BadRequest(new { success = false, message = "Config key is required." });
            }

            return await GetByKeyInternal(key.Trim());
        }

        private async Task<IActionResult> GetByKeyInternal(string keyName)
        {
            var cleanKey = keyName.Trim().ToLower();
            var config = await _context.SystemConfigs
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Key.ToLower() == cleanKey);

            if (config != null && !string.IsNullOrWhiteSpace(config.JsonValue))
            {
                return Ok(FormatConfigResponse(config));
            }

            // Fallback for business_hero config key
            if (cleanKey == "business_hero" || cleanKey == "businesshero")
            {
                var defaultHeroValue = new
                {
                    title = "Partner with Honeywell Security",
                    subtitle = "Grow your security business with industry-leading products and partner support.",
                    badge = "Honeywell Partner Network",
                    ctaText = "Apply Now"
                };

                return Ok(new
                {
                    key = "business_hero",
                    Key = "business_hero",
                    value = defaultHeroValue,
                    Value = defaultHeroValue,
                    data = defaultHeroValue
                });
            }

            // Fallback for contact_hero config key
            if (cleanKey == "contact_hero" || cleanKey == "contacthero")
            {
                var defaultContactHeroValue = new
                {
                    eyebrow = "CONTACT US",
                    title = "Talk to Our Team",
                    subtitle = "Send a product, sales, support or business enquiry to Honeywell.",
                    description = "Send a product, sales, support or business enquiry to Honeywell.",
                    backgroundImage = "/uploads/about/hero.jpg"
                };

                return Ok(new
                {
                    key = "contact_hero",
                    Key = "contact_hero",
                    eyebrow = "CONTACT US",
                    title = "Talk to Our Team",
                    subtitle = "Send a product, sales, support or business enquiry to Honeywell.",
                    description = "Send a product, sales, support or business enquiry to Honeywell.",
                    backgroundImage = "/uploads/about/hero.jpg",
                    value = defaultContactHeroValue,
                    Value = defaultContactHeroValue,
                    data = defaultContactHeroValue
                });
            }

            // Fallback for solutions_header config key
            if (cleanKey == "solutions_header" || cleanKey == "solutionsheader")
            {
                var defaultSolutionsHeaderValue = new
                {
                    eyebrow = "SOLUTIONS",
                    title = "Honeywell Enterprise & Commercial Security Solutions",
                    subtitle = "Tailored security, surveillance, and smart scanning architectures built for modern business requirements."
                };

                return Ok(new
                {
                    key = "solutions_header",
                    Key = "solutions_header",
                    eyebrow = "SOLUTIONS",
                    title = "Honeywell Enterprise & Commercial Security Solutions",
                    subtitle = "Tailored security, surveillance, and smart scanning architectures built for modern business requirements.",
                    value = defaultSolutionsHeaderValue,
                    Value = defaultSolutionsHeaderValue,
                    data = defaultSolutionsHeaderValue
                });
            }

            // Fallback for contact_card config key
            if (cleanKey == "contact_card")
            {
                var defaultContact = new
                {
                    phone = "+1 (800) 323-0194",
                    email = "support@honeywell.com",
                    hours = "Mon-Sat: 9:00 AM - 6:00 PM"
                };

                return Ok(new
                {
                    key = "contact_card",
                    Key = "contact_card",
                    value = defaultContact,
                    Value = defaultContact
                });
            }

            return NotFound(new
            {
                success = false,
                message = $"System config with key '{keyName}' not found.",
                key = keyName,
                value = (object?)null
            });
        }

        // 3. POST / PUT: api/SystemConfigs  (or api/SystemConfig)
        [HttpPost]
        [HttpPut]
        public async Task<IActionResult> SaveConfig([FromBody] JsonElement payload, [FromQuery] string? key)
        {
            try
            {
                if (payload.ValueKind == JsonValueKind.Undefined || payload.ValueKind == JsonValueKind.Null)
                {
                    return BadRequest(new { success = false, message = "Payload is required." });
                }

                string targetKey = key ?? "";
                JsonElement valueElement = payload;

                // If payload is an object containing "key" and "value" properties
                if (payload.ValueKind == JsonValueKind.Object)
                {
                    if (string.IsNullOrWhiteSpace(targetKey) && payload.TryGetProperty("key", out var keyProp) && keyProp.ValueKind == JsonValueKind.String)
                    {
                        targetKey = keyProp.GetString() ?? "";
                    }

                    if (payload.TryGetProperty("value", out var valProp))
                    {
                        valueElement = valProp;
                    }
                }

                if (string.IsNullOrWhiteSpace(targetKey))
                {
                    return BadRequest(new { success = false, message = "Config key is required either in query string or payload ('key')." });
                }

                string jsonValue = valueElement.ValueKind == JsonValueKind.String
                    ? valueElement.GetString() ?? ""
                    : valueElement.GetRawText();

                var item = await _context.SystemConfigs.FirstOrDefaultAsync(c => c.Key.ToLower() == targetKey.ToLower());
                if (item == null)
                {
                    item = new SystemConfig
                    {
                        Key = targetKey,
                        JsonValue = jsonValue,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.SystemConfigs.Add(item);
                }
                else
                {
                    item.JsonValue = jsonValue;
                    item.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = $"System config '{targetKey}' updated successfully.",
                    config = FormatConfigResponse(item)
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving system config: {ex}");
                return StatusCode(500, new { success = false, message = "Failed to save system config.", error = ex.Message });
            }
        }

        // 4. PUT: api/SystemConfigs/{key}
        [HttpPut("{key}")]
        public async Task<IActionResult> SaveConfigByKey(string key, [FromBody] JsonElement payload)
        {
            return await SaveConfig(payload, key);
        }

        // --- Helper Formatter Function ---
        private static object FormatConfigResponse(SystemConfig config)
        {
            object parsedValue;
            try
            {
                using var doc = JsonDocument.Parse(config.JsonValue);
                parsedValue = JsonSerializer.Deserialize<object>(config.JsonValue) ?? config.JsonValue;
            }
            catch
            {
                parsedValue = config.JsonValue;
            }

            return new
            {
                id = config.Id,
                key = config.Key,
                Key = config.Key,
                value = parsedValue,
                Value = parsedValue,
                updatedAt = config.UpdatedAt
            };
        }
    }
}
