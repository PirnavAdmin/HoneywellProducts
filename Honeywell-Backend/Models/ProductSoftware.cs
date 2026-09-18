using System;
using System.ComponentModel.DataAnnotations;

namespace Honeywell.Models
{
    public class ProductSoftware
    {
        [Key]
        public int Id { get; set; }

        public int ProductId { get; set; }
        public Product? Product { get; set; }

        [Required]
        [MaxLength(200)]
        public string SoftwareName { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string SoftwareType { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Version { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Platform { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Architecture { get; set; }

        [MaxLength(500)]
        public string? FileUrl { get; set; }

        [MaxLength(500)]
        public string? ExternalUrl { get; set; }

        [MaxLength(255)]
        public string? OriginalFileName { get; set; }

        [MaxLength(255)]
        public string? StoredFileName { get; set; }

        public long? FileSize { get; set; }

        [MaxLength(100)]
        public string? MimeType { get; set; }

        public DateTime ReleaseDate { get; set; } = DateTime.UtcNow;

        public string? ReleaseNotes { get; set; }

        public string? MinimumRequirements { get; set; }

        [MaxLength(20)]
        public string Status { get; set; } = "Active";

        public bool IsFeatured { get; set; } = false;

        public int SortOrder { get; set; } = 0;

        public int DownloadCount { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [MaxLength(100)]
        public string? CreatedBy { get; set; }

        [MaxLength(100)]
        public string? UpdatedBy { get; set; }
    }
}
