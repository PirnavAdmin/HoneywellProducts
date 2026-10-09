using System;

namespace Honeywell.Models
{
    public class PartnerUser
    {
        public int Id { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string ContactPerson { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Gstin { get; set; } = string.Empty;
        public string PartnerType { get; set; } = "Distributor"; // Distributor, Dealer, Reseller, OEM
        public string Status { get; set; } = "Active"; // Active, Pending, Rejected
        public decimal TotalCommissionEarned { get; set; } = 0m;
        public int TotalOrdersPlaced { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
