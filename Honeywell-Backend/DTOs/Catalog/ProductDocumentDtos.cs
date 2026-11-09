using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace Honeywell.DTOs.Catalog
{
    public class ProductDocumentDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ProductModel { get; set; } = string.Empty;
        public string? CategoryName { get; set; }
        public string Category { get; set; } = string.Empty; // Datasheets, User Manuals, Brochures, Certifications, Technical Documents
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Revision { get; set; }
        public string? Language { get; set; }
        public DateTime? DocumentDate { get; set; }
        public string? FileUrl { get; set; }
        public string? OriginalFileName { get; set; }
        public long? FileSize { get; set; }
        public string? MimeType { get; set; }
        public string Status { get; set; } = "Active";
        public int SortOrder { get; set; } = 0;
        public int DownloadCount { get; set; } = 0;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateProductDocumentDto
    {
        [Required]
        public int ProductId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Category { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [MaxLength(50)]
        public string? Revision { get; set; }

        [MaxLength(50)]
        public string? Language { get; set; } = "English";

        public DateTime? DocumentDate { get; set; }

        public string Status { get; set; } = "Active";

        public int SortOrder { get; set; } = 0;

        public IFormFile? File { get; set; }
    }

    public class UpdateProductDocumentDto
    {
        public int? ProductId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Category { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [MaxLength(50)]
        public string? Revision { get; set; }

        [MaxLength(50)]
        public string? Language { get; set; } = "English";

        public DateTime? DocumentDate { get; set; }

        public string? Status { get; set; }

        public int? SortOrder { get; set; }

        public bool KeepExistingFile { get; set; } = true;

        public IFormFile? File { get; set; }
    }
}
