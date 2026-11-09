using System;
using System.ComponentModel.DataAnnotations;

namespace Honeywell.Models
{
    public class ProductDocument
    {
        [Key]
        public int Id { get; set; }

        public int ProductId { get; set; }
        public Product? Product { get; set; }

        [Required]
        [MaxLength(100)]
        public string Category { get; set; } = string.Empty; // "Datasheets", "User Manuals", "Brochures", "Certifications", "Technical Documents"

        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [MaxLength(50)]
        public string? Revision { get; set; }

        [MaxLength(50)]
        public string? Language { get; set; } = "English";

        public DateTime? DocumentDate { get; set; }

        [MaxLength(500)]
        public string? FileUrl { get; set; }

        [MaxLength(255)]
        public string? OriginalFileName { get; set; }

        [MaxLength(255)]
        public string? StoredFileName { get; set; }

        public long? FileSize { get; set; }

        [MaxLength(100)]
        public string? MimeType { get; set; } = "application/pdf";

        [MaxLength(20)]
        public string Status { get; set; } = "Active";

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
