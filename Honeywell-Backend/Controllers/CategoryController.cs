using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Honeywell.Data;
using Honeywell.Models;
using Honeywell.DTOs.Catalog;

using Microsoft.Extensions.Caching.Memory;

namespace Honeywell.Controllers
{
    [ApiController]
    [Route("api/Category")]
    [Route("api/Categories")]
    [Route("api/Catalog/categories")]
    public class CategoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMemoryCache _cache;
        private const string CategoriesCacheKey = "ALL_CATEGORIES_CACHE";
        private static readonly System.Text.Json.JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public CategoryController(ApplicationDbContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        private async Task<string?> SaveUploadedFileAsync(IFormFile? file)
        {
            if (file == null || file.Length == 0)
                return null;

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "categories");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var uniqueFileName = $"cat_{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            var request = HttpContext.Request;
            var hostUrl = $"{request.Scheme}://{request.Host}";
            return $"{hostUrl}/uploads/categories/{uniqueFileName}";
        }

        private string GetFormValue(IFormCollection form, string key)
        {
            if (form.TryGetValue(key, out var val)) return val.ToString();
            foreach (var k in form.Keys)
            {
                if (k.Equals(key, StringComparison.OrdinalIgnoreCase))
                {
                    return form[k].ToString();
                }
            }
            return string.Empty;
        }

        private IFormFile? GetFormFile(IFormCollection form, string key)
        {
            var file = form.Files.GetFile(key);
            if (file != null) return file;
            foreach (var f in form.Files)
            {
                if (f.Name.Equals(key, StringComparison.OrdinalIgnoreCase))
                {
                    return f;
                }
            }
            return null;
        }

        private async Task<CategoryUpsertRequest> GetCategoryRequestAsync()
        {
            if (Request.HasFormContentType)
            {
                var form = await Request.ReadFormAsync();
                
                int? parsedId = null;
                var idStr = GetFormValue(form, "Id");
                if (string.IsNullOrEmpty(idStr)) idStr = GetFormValue(form, "id");
                if (string.IsNullOrEmpty(idStr)) idStr = GetFormValue(form, "categoryId");
                if (int.TryParse(idStr, out int idVal) && idVal > 0)
                {
                    parsedId = idVal;
                }

                var name = GetFormValue(form, "Name");
                if (string.IsNullOrEmpty(name)) name = GetFormValue(form, "categoryName");
                if (string.IsNullOrEmpty(name)) name = GetFormValue(form, "CategoryName");
                if (string.IsNullOrEmpty(name)) name = GetFormValue(form, "category_name");
                if (string.IsNullOrEmpty(name)) name = GetFormValue(form, "category");

                var desc = GetFormValue(form, "Description");
                if (string.IsNullOrEmpty(desc)) desc = GetFormValue(form, "categoryDescription");
                if (string.IsNullOrEmpty(desc)) desc = GetFormValue(form, "category_description");

                var imgUrl = GetFormValue(form, "ImageUrl");
                if (string.IsNullOrEmpty(imgUrl)) imgUrl = GetFormValue(form, "image");

                return new CategoryUpsertRequest
                {
                    Id = parsedId,
                    Name = name,
                    Description = desc,
                    ImageUrl = imgUrl,
                    ImageFile = GetFormFile(form, "ImageFile") ?? GetFormFile(form, "image") ?? GetFormFile(form, "file") ?? form.Files.FirstOrDefault()
                };
            }
            else
            {
                try
                {
                    Request.EnableBuffering();
                    using (var reader = new StreamReader(Request.Body, Encoding.UTF8, true, 1024, true))
                    {
                        var bodyStr = await reader.ReadToEndAsync();
                    }
                    Request.Body.Position = 0;

                    var dict = await Request.ReadFromJsonAsync<Dictionary<string, object>>(_jsonOptions);

                    string GetVal(string key, string? alt1 = null, string? alt2 = null, string? alt3 = null, string? alt4 = null)
                    {
                        if (dict == null) return string.Empty;
                        string Match(string k)
                        {
                            foreach (var dk in dict.Keys)
                            {
                                if (dk.Equals(k, StringComparison.OrdinalIgnoreCase))
                                {
                                    return dict[dk]?.ToString() ?? string.Empty;
                                }
                            }
                            return string.Empty;
                        }
                        var v = Match(key);
                        if (string.IsNullOrEmpty(v) && alt1 != null) v = Match(alt1);
                        if (string.IsNullOrEmpty(v) && alt2 != null) v = Match(alt2);
                        if (string.IsNullOrEmpty(v) && alt3 != null) v = Match(alt3);
                        if (string.IsNullOrEmpty(v) && alt4 != null) v = Match(alt4);
                        return v;
                    }

                    int? parsedId = null;
                    var idStr = GetVal("Id", "id", "categoryId");
                    if (int.TryParse(idStr, out int idVal) && idVal > 0)
                    {
                        parsedId = idVal;
                    }

                    return new CategoryUpsertRequest
                    {
                        Id = parsedId,
                        Name = GetVal("Name", "categoryName", "CategoryName", "category_name", "category"),
                        Description = GetVal("Description", "categoryDescription", "category_description", "description"),
                        ImageUrl = GetVal("ImageUrl", "image")
                    };
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Category parsing failed: {ex.Message}");
                    return new CategoryUpsertRequest();
                }
            }
        }

        // GET: api/Category
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
        {
            if (!_cache.TryGetValue(CategoriesCacheKey, out List<Category>? categories) || categories == null)
            {
                categories = await _context.Categories
                    .AsNoTracking()
                    .Include(c => c.Subcategories)
                    .ToListAsync();

                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(15))
                    .SetSlidingExpiration(TimeSpan.FromMinutes(5));

                _cache.Set(CategoriesCacheKey, categories, cacheOptions);
            }
            return Ok(categories);
        }

        // GET: api/Category/{id}
        [HttpGet("{id:int}")]
        public async Task<ActionResult<Category>> GetCategoryById(int id)
        {
            var category = await _context.Categories
                .AsNoTracking()
                .Include(c => c.Subcategories)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
            {
                return NotFound(new { message = $"Category with ID {id} not found." });
            }

            return Ok(category);
        }

        // POST: api/Category/upload-image
        [HttpPost("upload-image")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadImage([FromForm] CategoryUploadImageRequest dto)
        {
            var targetFile = dto.File ?? dto.Image ?? dto.ImageFile ?? Request.Form.Files.FirstOrDefault();
            if (targetFile == null || targetFile.Length == 0)
            {
                return BadRequest(new { message = "No image file provided for upload." });
            }

            var uploadedUrl = await SaveUploadedFileAsync(targetFile);
            return Ok(new { imageUrl = uploadedUrl, image = uploadedUrl, url = uploadedUrl });
        }

    public class CategoryUploadImageRequest
    {
        public IFormFile? File { get; set; }
        public IFormFile? Image { get; set; }
        public IFormFile? ImageFile { get; set; }
    }

        // POST: api/Category
        [HttpPost]
        public async Task<ActionResult<Category>> CreateOrUpdateCategoryPost()
        {
            var request = await GetCategoryRequestAsync();
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { message = "Category name is required." });
            }

            var uploadedUrl = await SaveUploadedFileAsync(request.ImageFile);
            var finalImageUrl = uploadedUrl ?? request.ImageUrl;

            Category category;
            if (request.Id.HasValue && request.Id.Value > 0)
            {
                category = await _context.Categories.FindAsync(request.Id.Value) ?? new Category();
                if (category.Id == 0)
                {
                    category.Id = request.Id.Value;
                    _context.Categories.Add(category);
                }
            }
            else
            {
                category = new Category();
                _context.Categories.Add(category);
            }

            category.Name = request.Name.Trim();
            category.Description = request.Description ?? string.Empty;
            category.IsActive = true;

            if (!string.IsNullOrEmpty(finalImageUrl))
            {
                category.ImageUrl = finalImageUrl;
            }

            await _context.SaveChangesAsync();
            _cache.Remove(CategoriesCacheKey);
            return Ok(category);
        }

        // PUT: api/Category/{id} or POST: api/Category/{id}
        [HttpPut("{id:int}")]
        [HttpPost("{id:int}")]
        public async Task<IActionResult> UpdateCategory(int id)
        {
            var request = await GetCategoryRequestAsync();
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound(new { message = $"Category with ID {id} not found." });
            }

            if (!string.IsNullOrWhiteSpace(request.Name))
            {
                category.Name = request.Name.Trim();
            }

            category.Description = request.Description ?? category.Description;

            var uploadedUrl = await SaveUploadedFileAsync(request.ImageFile);
            var finalImageUrl = uploadedUrl ?? (!string.IsNullOrEmpty(request.ImageUrl) ? request.ImageUrl : null);

            if (!string.IsNullOrEmpty(finalImageUrl))
            {
                category.ImageUrl = finalImageUrl;
            }

            await _context.SaveChangesAsync();
            _cache.Remove(CategoriesCacheKey);

            return Ok(category);
        }

        // DELETE: api/Category/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound(new { message = $"Category with ID {id} not found." });
            }

            var hasSubcategories = await _context.Subcategories.AnyAsync(s => s.CategoryId == id);
            if (hasSubcategories)
            {
                return BadRequest(new { message = "Cannot delete category because it contains active subcategories. Please delete the subcategories first." });
            }

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();
            _cache.Remove(CategoriesCacheKey);
            return Ok(new { message = $"Category with ID {id} deleted successfully." });
        }
    }
}
