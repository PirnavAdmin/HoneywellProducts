using System;

namespace Honeywell.Models
{
    public class Offer
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string BadgeTag { get; set; } = "SPECIAL PRICE"; // e.g. "SPECIAL PRICE", "BEST DEAL", "LIMITED OFFER", "NEW OFFER"
        public decimal OriginalPrice { get; set; }
        public decimal DealPrice { get; set; }
        public int DiscountPercentage { get; set; }
        public string Description { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public DateTime EndDate { get; set; } = DateTime.UtcNow.AddDays(30);
        public bool IsActive { get; set; } = true;
        public int DisplayOrder { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int? ProductId { get; set; }
        public Product? Product { get; set; }

        public string DealType { get; set; } = "ProductOffer"; // ProductOffer, CategoryOffer, FlashDeal, FeaturedDeal
        public int? CategoryId { get; set; }
        public int? SubcategoryId { get; set; }

        public string DiscountType { get; set; } = "Percentage"; // Percentage, Flat
        public decimal DiscountValue { get; set; }

        public DateTime? StartDate { get; set; }
        public string ImageSource { get; set; } = "CustomBanner"; // ProductImage, CustomBanner

        public bool IsFeatured { get; set; } = false;
        public bool ShowDiscountBadge { get; set; } = true;
        public bool ShowCountdownTimer { get; set; } = true;
    }
}
