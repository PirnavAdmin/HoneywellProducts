using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace Honeywell.DTOs.Catalog
{
    public class ProductSoftwareDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ProductModel { get; set; } = string.Empty;
        public string SoftwareName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string SoftwareType { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public string Platform { get; set; } = string.Empty;
        public string? Architecture { get; set; }
        public string? FileUrl { get; set; }
        public string? ExternalUrl { get; set; }
        public string? OriginalFileName { get; set; }
        public long? FileSize { get; set; }
        public string? MimeType { get; set; }
        public DateTime ReleaseDate { get; set; }
        public string? ReleaseNotes { get; set; }
        public string? MinimumRequirements { get; set; }
        public string Status { get; set; } = "Active";
        public bool IsFeatured { get; set; }
        public int SortOrder { get; set; }
        public int DownloadCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateProductSoftwareDto
    {
        [Required(ErrorMessage = "ProductId is required.")]
        public int ProductId { get; set; }

        [Required(ErrorMessage = "SoftwareName is required.")]
        [StringLength(200, ErrorMessage = "SoftwareName cannot exceed 200 characters.")]
        public string SoftwareName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Description is required.")]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "SoftwareType is required.")]
        [StringLength(100)]
        public string SoftwareType { get; set; } = string.Empty;

        [Required(ErrorMessage = "Version is required.")]
        [StringLength(50)]
        public string Version { get; set; } = string.Empty;

        [Required(ErrorMessage = "Platform is required.")]
        [StringLength(100)]
        public string Platform { get; set; } = string.Empty;

        [StringLength(50)]
        public string? Architecture { get; set; }

        [StringLength(500)]
        public string? ExternalUrl { get; set; }

        public DateTime? ReleaseDate { get; set; }
        public string? ReleaseNotes { get; set; }
        public string? MinimumRequirements { get; set; }

        [StringLength(20)]
        public string Status { get; set; } = "Active";

        public bool IsFeatured { get; set; } = false;
        public int SortOrder { get; set; } = 0;

        public IFormFile? File { get; set; }
    }

    public class UpdateProductSoftwareDto
    {
        [Required(ErrorMessage = "ProductId is required.")]
        public int ProductId { get; set; }

        [Required(ErrorMessage = "SoftwareName is required.")]
        [StringLength(200)]
        public string SoftwareName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Description is required.")]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "SoftwareType is required.")]
        [StringLength(100)]
        public string SoftwareType { get; set; } = string.Empty;

        [Required(ErrorMessage = "Version is required.")]
        [StringLength(50)]
        public string Version { get; set; } = string.Empty;

        [Required(ErrorMessage = "Platform is required.")]
        [StringLength(100)]
        public string Platform { get; set; } = string.Empty;

        [StringLength(50)]
        public string? Architecture { get; set; }

        [StringLength(500)]
        public string? ExternalUrl { get; set; }

        public DateTime? ReleaseDate { get; set; }
        public string? ReleaseNotes { get; set; }
        public string? MinimumRequirements { get; set; }

        [StringLength(20)]
        public string Status { get; set; } = "Active";

        public bool IsFeatured { get; set; } = false;
        public int SortOrder { get; set; } = 0;

        public IFormFile? File { get; set; }
        public bool KeepExistingFile { get; set; } = true;
    }
}
