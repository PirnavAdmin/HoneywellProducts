using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Honeywell.Models
{
    [Table("Distributors")]
    public class Distributor
    {
        [Key]
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty; // e.g., Apex Electro-Tech Solutions LLP / bhargava
        public string PartnerType { get; set; } = "Distributor"; // Authorized Distributor, Official Verified Distributor, Dealer, Reseller, System Integrator
        public string BadgeText { get; set; } = "AUTHORIZED"; // AUTHORIZED, OFFICIAL VERIFIED DISTRIBUTOR, OFFICIAL VERIFIED DEALER
        public string Region { get; set; } = string.Empty; // West India, South India, Central India, East India, North India
        public string Territory { get; set; } = string.Empty; // Central India (ts), Maharashtra, Karnataka & TN
        
        public string CoverageLocations { get; set; } = string.Empty; // Mumbai & Pune, Maharashtra
        public string Address { get; set; } = string.Empty;

        // Contact Lead Information
        public string ContactPerson { get; set; } = string.Empty; // Vikram Desai, bhargava
        public string ContactTitle { get; set; } = string.Empty; // VP Channel Distribution, Commercial Channel Lead
        public string Phone { get; set; } = string.Empty; // +91 98201 87654
        public string Email { get; set; } = string.Empty; // v.desai@apexelectrotech.in
        public string Gstin { get; set; } = string.Empty; // 27AACFA8876K1ZQ

        // Product Categories / Specializations (Comma separated)
        public string ProductCategories { get; set; } = string.Empty; // IP Cameras & Domes, Solar Surveillance, PoE Network Switches

        // Logistics, SLA & Performance Metadata
        public string DispatchSla { get; set; } = "24-48 Hours Express"; // 24-48h Express, 24h Metro Dispatch, Same-day / 24h Statewide
        public string BufferCapacity { get; set; } = "Stock Ready"; // 40,000+ Units Stock, 35,000+ Units Buffer
        public string CommercialTerms { get; set; } = "Wholesale Commercial Terms";
        public string Rating { get; set; } = "4.8/5 (Verified)";
        public string Description { get; set; } = string.Empty;

        // Administration & Display Controls
        public bool IsVerified { get; set; } = true;
        public bool IsActive { get; set; } = true;
        public int DisplayOrder { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }

    public class DistributorUpsertDto
    {
        public string Name { get; set; } = string.Empty;
        public string? PartnerType { get; set; }
        public string? BadgeText { get; set; }
        public string? Region { get; set; }
        public string? Territory { get; set; }
        public string? CoverageLocations { get; set; }
        public string? Address { get; set; }
        public string? ContactPerson { get; set; }
        public string? ContactTitle { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Gstin { get; set; }
        public string? ProductCategories { get; set; }
        public string? DispatchSla { get; set; }
        public string? BufferCapacity { get; set; }
        public string? CommercialTerms { get; set; }
        public string? Rating { get; set; }
        public string? Description { get; set; }
        public bool? IsVerified { get; set; }
        public bool? IsActive { get; set; }
        public int? DisplayOrder { get; set; }
    }

    public class DistributorQuoteRequestDto
    {
        public int? DistributorId { get; set; }
        public string? DistributorName { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Mobile { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? CompanyName { get; set; }
        public string? ProductRequirement { get; set; }
        public int? Quantity { get; set; }
        public string? Notes { get; set; }
    }
}
