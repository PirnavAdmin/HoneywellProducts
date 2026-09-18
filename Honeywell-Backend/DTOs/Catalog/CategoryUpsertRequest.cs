using Microsoft.AspNetCore.Http;

namespace Honeywell.DTOs.Catalog
{
    public class CategoryUpsertRequest
    {
        public int? Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Slug { get; set; }
        public string Description { get; set; } = string.Empty;
        public int? DisplayOrder { get; set; }
        public bool? IsActive { get; set; }
        public string? MetaTitle { get; set; }
        public string? MetaDescription { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public IFormFile? ImageFile { get; set; }
    }
}
