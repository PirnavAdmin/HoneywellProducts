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
    [Route("api/growth-journey")]
    [Route("api/GrowthSection")]
    public class GrowthJourneyController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public GrowthJourneyController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/GrowthJourney or api/growth-journey
        [HttpGet]
        public async Task<IActionResult> GetGrowthJourney()
        {
            var data = await _context.GrowthJourneys
                .OrderBy(x => x.Year)
                .Select(x => new GrowthDataItemDto
                {
                    Id = x.Id,
                    Year = x.Year,
                    Business = x.Business,
                    Products = x.Products,
                    Customers = x.Customers,
                    Sales = x.Sales
                })
                .ToListAsync();

            if (!data.Any())
            {
                // Fallback default data
                data = GetDefaultGrowthData();
            }

            var latestItem = data.LastOrDefault();
            double latestIndex = latestItem != null ? latestItem.Sales : 76;

            var response = new GrowthJourneyResponseDto
            {
                Eyebrow = "DEMO DATA VISUALIZATION",
                Title = "Our Growth Journey",
                Description = "All values are illustrative growth indices. Replace them with verified client data before representing company performance.",
                LatestIndex = latestIndex,
                Metrics = new Dictionary<string, MetricInfoDto>
                {
                    { "business", new MetricInfoDto { Label = "Business Growth", Suffix = "" } },
                    { "products", new MetricInfoDto { Label = "Product Range Growth", Suffix = "" } },
                    { "customers", new MetricInfoDto { Label = "Customer Network Growth", Suffix = "" } },
                    { "sales", new MetricInfoDto { Label = "Sales Growth", Suffix = "" } }
                },
                GrowthData = data
            };

            return Ok(response);
        }

        // GET: api/GrowthJourney/data or api/growth-journey/data
        [HttpGet("data")]
        public async Task<IActionResult> GetGrowthDataArray()
        {
            var data = await _context.GrowthJourneys
                .OrderBy(x => x.Year)
                .Select(x => new GrowthDataItemDto
                {
                    Id = x.Id,
                    Year = x.Year,
                    Business = x.Business,
                    Products = x.Products,
                    Customers = x.Customers,
                    Sales = x.Sales
                })
                .ToListAsync();

            if (!data.Any())
            {
                data = GetDefaultGrowthData();
            }

            return Ok(data);
        }

        // GET: api/GrowthJourney/{idOrYear}
        [HttpGet("{idOrYear}")]
        public async Task<IActionResult> GetByIdOrYear(string idOrYear)
        {
            GrowthJourney? item = null;
            if (int.TryParse(idOrYear, out int id))
            {
                item = await _context.GrowthJourneys.FindAsync(id);
            }

            if (item == null)
            {
                item = await _context.GrowthJourneys.FirstOrDefaultAsync(x => x.Year.ToLower() == idOrYear.ToLower());
            }

            if (item == null)
            {
                return NotFound(new { message = $"Growth data entry for '{idOrYear}' not found." });
            }

            return Ok(item);
        }

        // POST: api/GrowthJourney
        [HttpPost]
        public async Task<IActionResult> CreateOrUpdate([FromBody] CreateOrUpdateGrowthDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Year))
            {
                return BadRequest(new { message = "Year field is required." });
            }

            var existing = await _context.GrowthJourneys.FirstOrDefaultAsync(x => x.Year == dto.Year.Trim());
            if (existing == null)
            {
                existing = new GrowthJourney
                {
                    Year = dto.Year.Trim(),
                    Business = dto.Business,
                    Products = dto.Products,
                    Customers = dto.Customers,
                    Sales = dto.Sales,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.GrowthJourneys.Add(existing);
            }
            else
            {
                existing.Business = dto.Business;
                existing.Products = dto.Products;
                existing.Customers = dto.Customers;
                existing.Sales = dto.Sales;
                existing.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        // PUT: api/GrowthJourney/bulk
        [HttpPut("bulk")]
        public async Task<IActionResult> BulkUpdate([FromBody] List<CreateOrUpdateGrowthDto> dtoList)
        {
            if (dtoList == null || !dtoList.Any())
            {
                return BadRequest(new { message = "Growth data list cannot be empty." });
            }

            foreach (var dto in dtoList)
            {
                if (string.IsNullOrWhiteSpace(dto.Year)) continue;

                var existing = await _context.GrowthJourneys.FirstOrDefaultAsync(x => x.Year == dto.Year.Trim());
                if (existing == null)
                {
                    existing = new GrowthJourney
                    {
                        Year = dto.Year.Trim(),
                        Business = dto.Business,
                        Products = dto.Products,
                        Customers = dto.Customers,
                        Sales = dto.Sales,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.GrowthJourneys.Add(existing);
                }
                else
                {
                    existing.Business = dto.Business;
                    existing.Products = dto.Products;
                    existing.Customers = dto.Customers;
                    existing.Sales = dto.Sales;
                    existing.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Bulk growth data updated successfully." });
        }

        // DELETE: api/GrowthJourney/{idOrYear}
        [HttpDelete("{idOrYear}")]
        public async Task<IActionResult> Delete(string idOrYear)
        {
            GrowthJourney? item = null;
            if (int.TryParse(idOrYear, out int id))
            {
                item = await _context.GrowthJourneys.FindAsync(id);
            }

            if (item == null)
            {
                item = await _context.GrowthJourneys.FirstOrDefaultAsync(x => x.Year.ToLower() == idOrYear.ToLower());
            }

            if (item == null)
            {
                return NotFound(new { message = $"Growth data entry '{idOrYear}' not found." });
            }

            _context.GrowthJourneys.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Growth entry for year '{item.Year}' deleted successfully." });
        }

        private static List<GrowthDataItemDto> GetDefaultGrowthData()
        {
            return new List<GrowthDataItemDto>
            {
                new GrowthDataItemDto { Year = "2022", Business = 20, Products = 15, Customers = 24, Sales = 18 },
                new GrowthDataItemDto { Year = "2023", Business = 30, Products = 28, Customers = 34, Sales = 29 },
                new GrowthDataItemDto { Year = "2024", Business = 45, Products = 43, Customers = 47, Sales = 42 },
                new GrowthDataItemDto { Year = "2025", Business = 60, Products = 59, Customers = 63, Sales = 58 },
                new GrowthDataItemDto { Year = "2026", Business = 80, Products = 78, Customers = 82, Sales = 76 }
            };
        }
    }

    public class GrowthJourneyResponseDto
    {
        public string Eyebrow { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public double LatestIndex { get; set; }
        public Dictionary<string, MetricInfoDto> Metrics { get; set; } = new();
        public List<GrowthDataItemDto> GrowthData { get; set; } = new();
    }

    public class MetricInfoDto
    {
        public string Label { get; set; } = string.Empty;
        public string Suffix { get; set; } = string.Empty;
    }

    public class GrowthDataItemDto
    {
        public int Id { get; set; }
        public string Year { get; set; } = string.Empty;
        public double Business { get; set; }
        public double Products { get; set; }
        public double Customers { get; set; }
        public double Sales { get; set; }
    }

    public class CreateOrUpdateGrowthDto
    {
        public string Year { get; set; } = string.Empty;
        public double Business { get; set; }
        public double Products { get; set; }
        public double Customers { get; set; }
        public double Sales { get; set; }
    }
}
