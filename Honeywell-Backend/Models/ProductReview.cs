using System;

namespace Honeywell.Models
{
    public class ProductReview
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public decimal Rating { get; set; } = 5.0m;
        public DateTime ReviewDate { get; set; } = DateTime.UtcNow;
        public string ReviewComment { get; set; } = string.Empty;
        public bool VerifiedPurchase { get; set; } = true;
        public string Status { get; set; } = "Approved";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
