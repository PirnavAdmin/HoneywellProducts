using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Honeywell.Models
{
    [Table("Solutions")]
    public class Solution
    {
        [Key]
        public string Id { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Application { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string CategoryId { get; set; } = "cctv-cameras";

        public string ImageUrl { get; set; } = string.Empty;

        // Image alias for frontend compatibility
        [NotMapped]
        public string Image => !string.IsNullOrEmpty(ImageUrl) ? ImageUrl : "/uploads/solutions/default.jpg";

        public List<string> Features { get; set; } = new List<string>();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
