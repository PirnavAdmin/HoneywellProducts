using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Honeywell.Data;
using Honeywell.Models;

using Microsoft.Extensions.Caching.Memory;

namespace Honeywell.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BannersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMemoryCache _cache;
        private const string BannersCacheKey = "ALL_BANNERS_CACHE";

        public BannersController(ApplicationDbContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        // GET: api/Banners
        [HttpGet]
        public async Task<IActionResult> GetActiveBanners()
        {
            if (!_cache.TryGetValue(BannersCacheKey, out List<Banner>? banners) || banners == null)
            {
                banners = await _context.Banners
                    .AsNoTracking()
                    .Where(b => b.IsActive)
                    .OrderBy(b => b.DisplayOrder)
                    .ThenByDescending(b => b.CreatedAt)
                    .ToListAsync();

                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(15))
                    .SetSlidingExpiration(TimeSpan.FromMinutes(5));

                _cache.Set(BannersCacheKey, banners, cacheOptions);
            }

            return Ok(banners);
        }

        // GET: api/Banners/admin
        [HttpGet("admin")]
        public async Task<IActionResult> GetAllBannersForAdmin()
        {
            var banners = await _context.Banners
                .OrderBy(b => b.DisplayOrder)
                .ThenByDescending(b => b.CreatedAt)
                .ToListAsync();

            return Ok(banners);
        }

        // GET: api/Banners/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var banner = await _context.Banners.FindAsync(id);
            if (banner == null)
            {
                return NotFound(new { Message = "Banner not found." });
            }
            return Ok(banner);
        }

        // POST: api/Banners
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Banner banner)
        {
            if (string.IsNullOrEmpty(banner.Title))
            {
                return BadRequest(new { Message = "Title is required." });
            }

            banner.CreatedAt = DateTime.UtcNow;
            _context.Banners.Add(banner);
            await _context.SaveChangesAsync();
            _cache.Remove(BannersCacheKey);
            return CreatedAtAction(nameof(GetById), new { id = banner.Id }, banner);
        }

        // PUT: api/Banners/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Banner banner)
        {
            var existing = await _context.Banners.FindAsync(id);
            if (existing == null)
            {
                return NotFound(new { Message = "Banner not found." });
            }

            existing.Title = banner.Title;
            existing.Subtitle = banner.Subtitle;
            existing.Description = banner.Description;
            if (!string.IsNullOrEmpty(banner.ImageUrl))
            {
                existing.ImageUrl = banner.ImageUrl;
            }
            existing.TargetUrl = banner.TargetUrl;
            existing.DisplayOrder = banner.DisplayOrder;
            existing.IsActive = banner.IsActive;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            _cache.Remove(BannersCacheKey);
            return Ok(existing);
        }

        // PUT: api/Banners/5/toggle
        [HttpPut("{id}/toggle")]
        public async Task<IActionResult> ToggleActive(int id)
        {
            var banner = await _context.Banners.FindAsync(id);
            if (banner == null)
            {
                return NotFound(new { Message = "Banner not found." });
            }

            banner.IsActive = !banner.IsActive;
            banner.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            _cache.Remove(BannersCacheKey);
            return Ok(new { Message = $"Banner active status updated to {banner.IsActive}.", banner.IsActive });
        }

        // DELETE: api/Banners/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var banner = await _context.Banners.FindAsync(id);
            if (banner == null)
            {
                return NotFound(new { Message = "Banner not found." });
            }

            _context.Banners.Remove(banner);
            await _context.SaveChangesAsync();
            _cache.Remove(BannersCacheKey);
            return NoContent();
        }

        // POST: api/Banners/upload-image
        [HttpPost("upload-image")]
        public async Task<IActionResult> UploadBannerImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { Message = "No file uploaded." });
            }

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "banners");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var imageUrl = $"/uploads/banners/{fileName}";
            return Ok(new { ImageUrl = imageUrl });
        }
    }
}
