using System;
using System.ComponentModel.DataAnnotations;

namespace Honeywell.Models
{
    public class Banner
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Title { get; set; } = string.Empty;

        public string? Subtitle { get; set; }

        public string? Description { get; set; }

        [Required]
        public string ImageUrl { get; set; } = string.Empty;

        public string? TargetUrl { get; set; }

        public int DisplayOrder { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}
