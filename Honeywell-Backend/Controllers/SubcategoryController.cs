using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Honeywell.Data;
using Honeywell.Models;
using Honeywell.DTOs.Catalog;

namespace Honeywell.Controllers
{
    [ApiController]
    [Route("api/Subcategory")]
    [Route("api/Subcategories")]
    [Route("api/Catalog/subcategories")]
    public class SubcategoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMemoryCache _cache;
        private const string SubcategoriesCacheKey = "ALL_SUBCATEGORIES_CACHE";

        public SubcategoryController(ApplicationDbContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Subcategory>>> GetSubcategories()
        {
            if (!_cache.TryGetValue(SubcategoriesCacheKey, out List<Subcategory>? subcategories) || subcategories == null)
            {
                subcategories = await _context.Subcategories
                    .AsNoTracking()
                    .Include(s => s.Category)
                    .ToListAsync();

                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(15))
                    .SetSlidingExpiration(TimeSpan.FromMinutes(5));

                _cache.Set(SubcategoriesCacheKey, subcategories, cacheOptions);
            }
            return Ok(subcategories);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Subcategory>> GetSubcategoryById(int id)
        {
            var subcategory = await _context.Subcategories
                .Include(s => s.Category)
                .FirstOrDefaultAsync(s => s.Id == id);
            if (subcategory == null)
            {
                return NotFound(new { Message = "Subcategory not found." });
            }
            return Ok(subcategory);
        }

        [HttpPost]
        public async Task<ActionResult<Subcategory>> CreateSubcategory([FromBody] SubcategoryUpsertRequest request)
        {
            if (string.IsNullOrEmpty(request.Name))
            {
                return BadRequest(new { Message = "Subcategory name is required." });
            }

            var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId);
            if (!categoryExists)
            {
                return BadRequest(new { Message = "Invalid Category ID." });
            }

            var subcategory = new Subcategory
            {
                CategoryId = request.CategoryId,
                Name = request.Name,
                Description = request.Description,
                IsActive = true
            };

            _context.Subcategories.Add(subcategory);
            await _context.SaveChangesAsync();
            _cache.Remove(SubcategoriesCacheKey);

            return Ok(subcategory);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSubcategory(int id, [FromBody] SubcategoryUpsertRequest request)
        {
            var subcategory = await _context.Subcategories.FindAsync(id);
            if (subcategory == null)
            {
                return NotFound(new { Message = "Subcategory not found." });
            }

            var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId);
            if (!categoryExists)
            {
                return BadRequest(new { Message = "Invalid Category ID." });
            }

            subcategory.CategoryId = request.CategoryId;
            subcategory.Name = request.Name;
            subcategory.Description = request.Description;

            await _context.SaveChangesAsync();
            _cache.Remove(SubcategoriesCacheKey);

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSubcategory(int id)
        {
            var subcategory = await _context.Subcategories.FindAsync(id);
            if (subcategory == null)
            {
                return NotFound(new { Message = "Subcategory not found." });
            }

            // Product check removed
            var hasProducts = false;
            if (hasProducts) 
            {
                return BadRequest(new { Message = "Cannot delete subcategory because it is linked to active products. Please delete or reassign the products first." });
            }

            _context.Subcategories.Remove(subcategory);
            await _context.SaveChangesAsync();
            _cache.Remove(SubcategoriesCacheKey);

            return Ok(new { Message = "Subcategory deleted successfully." });
        }
    }
}

