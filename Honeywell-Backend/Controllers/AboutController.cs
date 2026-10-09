using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Honeywell.Data;
using Honeywell.Models;

namespace Honeywell.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Route("api/Settings/about-us")]
    public class AboutController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private const string ConfigKey = "about_us_config";

        public AboutController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. GET ABOUT US DATA (Public)
        // GET: api/About
        // GET: api/Settings/about-us
        [HttpGet]
        public async Task<IActionResult> GetAboutData()
        {
            var item = await _context.SystemConfigs.FirstOrDefaultAsync(c => c.Key == ConfigKey);
            if (item == null || string.IsNullOrWhiteSpace(item.JsonValue))
            {
                var defaultData = new
                {
                    hero = new
                    {
                        eyebrow = "ABOUT US",
                        title = "Security Technology With a Clear Purpose",
                        description = "A premium framework prepared for official company story, market position and leadership content.",
                        image = "/uploads/about/hero.jpg"
                    },
                    overview = new
                    {
                        eyebrow = "COMPANY OVERVIEW",
                        title = "Built for Product Discovery and Security Solutions",
                        lead = "The official company overview statement.",
                        description = "Scalable foundation for CCTV, security, solar product discovery, eCommerce preparation, bulk enquiries and channel partnerships.",
                        image = "/uploads/about/overview.jpg"
                    },
                    vision = new
                    {
                        title = "Long-term Vision Statement",
                        description = "Detailed vision goals."
                    },
                    mission = new
                    {
                        title = "Company Mission Statement",
                        description = "Detailed mission goals."
                    },
                    portfolio = new
                    {
                        eyebrow = "PRODUCT PORTFOLIO",
                        title = "Security, CCTV & Solar Power Product Portfolio",
                        description = "Comprehensive surveillance systems, solar panels, inverters, storage batteries, and recording solutions.",
                        items = new[]
                        {
                            new { icon = "Camera", title = "CCTV & Surveillance", text = "Analog, Dome, Bullet, PTZ, and IP security cameras." },
                            new { icon = "Sun", title = "Solar Panels & Energy", text = "High-efficiency Monocrystalline, Polycrystalline, and Bifacial modules." },
                            new { icon = "Zap", title = "Solar Inverters & Storage", text = "Off-grid and hybrid solar inverters, lithium & gel batteries." },
                            new { icon = "Network", title = "Recording & Networking", text = "NVRs, DVRs, surveillance drives, and PoE network switches." }
                        }
                    },
                    whyChooseUs = new
                    {
                        eyebrow = "WHY CHOOSE US",
                        title = "A Conservative, Client-Ready Approach",
                        description = "Statements avoid unsupported claims and remain ready for verified company information.",
                        items = new[]
                        {
                            new { icon = "ShieldCheck", title = "Practical Security Focus", text = "Product discovery organized around clear application needs." },
                            new { icon = "Eye", title = "Transparent Product Data", text = "Verified models and specifications." },
                            new { icon = "Handshake", title = "Business Ready", text = "Dedicated enquiry journeys for retail, bulk and partner requirements." }
                        }
                    },
                    ceo = new
                    {
                        name = "CEO Full Name",
                        designation = "Chief Executive Officer",
                        message = "Approved executive statement.",
                        subtext = "Supporting leadership statement.",
                        image = "/uploads/about/ceo.jpg"
                    }
                };

                return Ok(defaultData);
            }

            try
            {
                var parsedData = JsonSerializer.Deserialize<object>(item.JsonValue);
                return Ok(parsedData);
            }
            catch
            {
                return Ok(new { raw = item.JsonValue });
            }
        }

        // 2. UPDATE ABOUT US DATA (Admin)
        // PUT: api/About
        // POST: api/About
        // PUT: api/Settings/about-us
        // POST: api/Settings/about-us
        [HttpPut]
        [HttpPost]
        public async Task<IActionResult> UpdateAboutData([FromBody] object data)
        {
            if (data == null)
            {
                return BadRequest(new { success = false, message = "Payload is required." });
            }

            var item = await _context.SystemConfigs.FirstOrDefaultAsync(c => c.Key == ConfigKey);
            if (item == null)
            {
                item = new SystemConfig { Key = ConfigKey };
                _context.SystemConfigs.Add(item);
            }

            item.JsonValue = JsonSerializer.Serialize(data);
            item.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "About Us settings saved successfully.",
                data = JsonSerializer.Deserialize<object>(item.JsonValue)
            });
        }

        // 3. UPLOAD ABOUT US IMAGE (Admin)
        // POST: api/About/upload-image
        // POST: api/Settings/about-us/upload-image
        [HttpPost("upload-image")]
        public async Task<IActionResult> UploadAboutImage([FromForm] IFormFile? imageFile, [FromForm] IFormFile? file, [FromForm] string? section)
        {
            var targetFile = imageFile ?? file;
            if (targetFile == null || targetFile.Length == 0)
            {
                return BadRequest(new { success = false, message = "No image file provided." });
            }

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
            var extension = Path.GetExtension(targetFile.FileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(extension) || !allowedExtensions.Contains(extension))
            {
                return BadRequest(new { success = false, message = "Invalid file type. Supported formats: .jpg, .jpeg, .png, .webp, .gif" });
            }

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "about");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var sectionPrefix = !string.IsNullOrWhiteSpace(section) ? $"{section.Trim().ToLowerInvariant()}_" : "about_";
            var fileName = $"{sectionPrefix}{Guid.NewGuid():N}{extension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await targetFile.CopyToAsync(stream);
            }

            var imageUrl = $"/uploads/about/{fileName}";
            return Ok(new
            {
                success = true,
                message = "Image uploaded successfully.",
                imageUrl = imageUrl
            });
        }
    }
}
