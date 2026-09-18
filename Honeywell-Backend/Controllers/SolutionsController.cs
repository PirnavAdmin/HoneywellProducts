using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Honeywell.Data;
using Honeywell.Models;

namespace Honeywell.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SolutionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        private static readonly List<Solution> MockSolutions = new()
        {
            new Solution
            {
                Id = "commercial-surveillance",
                Title = "Commercial CCTV & AI Surveillance",
                Description = "Comprehensive IP surveillance systems with 4K recording, AI analytics, and thermal monitoring.",
                Application = "Commercial & Industrial",
                CategoryId = "cctv-cameras",
                ImageUrl = "/assets/images/catalog/cctv-camera.jpg",
                Features = new List<string> { "4K Ultra-HD Resolution", "AI Motion Detection & Human Filtering", "24/7 Night Vision with Smart Infrared" }
            },
            new Solution
            {
                Id = "access-control-perimeter",
                Title = "Access Control & Perimeter Defense",
                Description = "Smart biometric readers, RFID barriers, and cloud-managed access entry points for facilities.",
                Application = "Office & Facility Security",
                CategoryId = "networking",
                ImageUrl = "/assets/images/catalog/bullet-camera.jpg",
                Features = new List<string> { "Biometric Fingerprint & RFID Readers", "Centralized Real-Time Access Logs", "Emergency Automated Lockdown Support" }
            },
            new Solution
            {
                Id = "retail-loss-prevention",
                Title = "Retail Store & Loss Prevention",
                Description = "High-definition video monitoring to prevent shoplifting and audit cashier points.",
                Application = "Retail & POS Security",
                CategoryId = "dome-camera",
                ImageUrl = "/assets/images/catalog/dome-camera.jpg",
                Features = new List<string> { "POS Cashier Overlay Integration", "Foot-Traffic & Queue Analytics", "360° Panoramic Dome Coverage" }
            },
            new Solution
            {
                Id = "home-security",
                Title = "Smart Home Security & Monitoring",
                Description = "Flexible camera and sensor solutions for houses, apartments, and residential properties.",
                Application = "Residential & Apartments",
                CategoryId = "wifi-cameras",
                ImageUrl = "/assets/images/catalog/wifi-camera.jpg",
                Features = new List<string> { "Wireless Wi-Fi Connectivity", "Two-Way Audio Intercom", "Mobile Push Alerts & Cloud Recording" }
            },
            new Solution
            {
                Id = "warehouse-logistics",
                Title = "Warehouse & Logistics Security",
                Description = "Wide-area monitoring for loading bays, logistics zones, and inventory protection.",
                Application = "Warehouses & Distribution",
                CategoryId = "bullet-cameras",
                ImageUrl = "/assets/images/catalog/bullet-camera.jpg",
                Features = new List<string> { "Long-Range Infrared Night Vision", "License Plate Recognition (ANPR)", "Perimeter Breach Detection" }
            },
            new Solution
            {
                Id = "outdoor-solar-surveillance",
                Title = "Off-Grid Solar Surveillance",
                Description = "Autonomous 4G LTE solar-powered cameras for remote farms, construction sites, and perimeters.",
                Application = "Remote & Active Sites",
                CategoryId = "solar-cameras",
                ImageUrl = "/assets/images/catalog/solar-camera.jpg",
                Features = new List<string> { "100% Off-Grid Solar Power System", "Built-in 4G LTE Cellular Modem", "All-Weather IP67 Waterproof Design" }
            }
        };

        public SolutionsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/solutions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Solution>>> GetSolutions()
        {
            try
            {
                if (_context.Solutions != null && await _context.Solutions.AnyAsync())
                {
                    var dbSolutions = await _context.Solutions.ToListAsync();
                    return Ok(dbSolutions);
                }
            }
            catch
            {
                // Fallback to mock solutions if DB table isn't created yet
            }

            return Ok(MockSolutions);
        }

        // GET: api/solutions/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Solution>> GetSolutionById(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return BadRequest(new { message = "Solution ID is required." });
            }

            try
            {
                if (_context.Solutions != null && await _context.Solutions.AnyAsync())
                {
                    var dbSolution = await _context.Solutions.FirstOrDefaultAsync(s => s.Id.Equals(id, StringComparison.OrdinalIgnoreCase));
                    if (dbSolution != null) return Ok(dbSolution);
                }
            }
            catch
            {
                // Fallback to mock list
            }

            var solution = MockSolutions.FirstOrDefault(s => s.Id.Equals(id, StringComparison.OrdinalIgnoreCase));
            if (solution == null)
            {
                return NotFound(new { message = $"Solution with ID '{id}' was not found." });
            }

            return Ok(solution);
        }

        // POST: api/solutions
        [HttpPost]
        public async Task<ActionResult<Solution>> CreateSolution([FromBody] Solution solution)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (string.IsNullOrWhiteSpace(solution.Id))
            {
                solution.Id = Guid.NewGuid().ToString("N");
            }

            solution.CreatedAt = DateTime.UtcNow;
            solution.UpdatedAt = DateTime.UtcNow;

            try
            {
                if (_context.Solutions != null)
                {
                    _context.Solutions.Add(solution);
                    await _context.SaveChangesAsync();
                }
            }
            catch
            {
                // If DB write fails, update mock list
                MockSolutions.Add(solution);
            }

            return CreatedAtAction(nameof(GetSolutionById), new { id = solution.Id }, solution);
        }

        // PUT: api/solutions/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSolution(string id, [FromBody] Solution updated)
        {
            if (string.IsNullOrWhiteSpace(id) || updated == null)
            {
                return BadRequest(new { message = "Invalid solution payload." });
            }

            try
            {
                if (_context.Solutions != null)
                {
                    var dbExisting = await _context.Solutions.FirstOrDefaultAsync(s => s.Id.Equals(id, StringComparison.OrdinalIgnoreCase));
                    if (dbExisting != null)
                    {
                        dbExisting.Title = updated.Title;
                        dbExisting.Description = updated.Description;
                        dbExisting.Application = updated.Application;
                        dbExisting.CategoryId = updated.CategoryId;
                        dbExisting.ImageUrl = updated.ImageUrl;
                        dbExisting.Features = updated.Features;
                        dbExisting.UpdatedAt = DateTime.UtcNow;

                        await _context.SaveChangesAsync();
                        return Ok(dbExisting);
                    }
                }
            }
            catch
            {
                // Fallback
            }

            var mockExisting = MockSolutions.FirstOrDefault(s => s.Id.Equals(id, StringComparison.OrdinalIgnoreCase));
            if (mockExisting == null)
            {
                return NotFound(new { message = $"Solution with ID '{id}' not found." });
            }

            mockExisting.Title = updated.Title;
            mockExisting.Description = updated.Description;
            mockExisting.Application = updated.Application;
            mockExisting.CategoryId = updated.CategoryId;
            mockExisting.ImageUrl = updated.ImageUrl;
            mockExisting.Features = updated.Features;
            mockExisting.UpdatedAt = DateTime.UtcNow;

            return Ok(mockExisting);
        }

        // DELETE: api/solutions/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSolution(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return BadRequest(new { message = "Solution ID is required." });
            }

            try
            {
                if (_context.Solutions != null)
                {
                    var dbExisting = await _context.Solutions.FirstOrDefaultAsync(s => s.Id.Equals(id, StringComparison.OrdinalIgnoreCase));
                    if (dbExisting != null)
                    {
                        _context.Solutions.Remove(dbExisting);
                        await _context.SaveChangesAsync();
                        return Ok(new { success = true, message = $"Solution '{id}' deleted successfully." });
                    }
                }
            }
            catch
            {
                // Fallback
            }

            var mockExisting = MockSolutions.FirstOrDefault(s => s.Id.Equals(id, StringComparison.OrdinalIgnoreCase));
            if (mockExisting == null)
            {
                return NotFound(new { message = $"Solution with ID '{id}' not found." });
            }

            MockSolutions.Remove(mockExisting);
            return Ok(new { success = true, message = $"Solution '{id}' deleted successfully." });
        }
    }
}
