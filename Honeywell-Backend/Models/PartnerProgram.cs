using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Honeywell.Models
{
    [Table("PartnerPrograms")]
    public class PartnerProgram
    {
        [Key]
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Category { get; set; } = "integrator";
        public string Description { get; set; } = string.Empty;
        
        // Stored as JSON string or comma-separated list
        public string BenefitsJson { get; set; } = "[]";
        public string RequirementsJson { get; set; } = "[]";

        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class PartnerProgramDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> Benefits { get; set; } = new();
        public List<string> Requirements { get; set; } = new();
    }
}
