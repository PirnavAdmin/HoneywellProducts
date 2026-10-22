
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;

namespace Honeywell.DTOs
{
    public class CreateProductDto
    {
        public string ProductName { get; set; } = string.Empty;

        public string SKU { get; set; } = string.Empty;

        public string Brand { get; set; } = string.Empty;

        public string Manufacturer { get; set; } = string.Empty;

        // Pricing details
        public decimal? BasePrice { get; set; }

        public decimal MRP { get; set; }

        public decimal SellingPrice { get; set; }

        public decimal? CostPrice { get; set; }

        public int Stock { get; set; }

        public int? ReorderLevel { get; set; }

        public int CategoryId { get; set; }

        public int SubcategoryId { get; set; }

        // Product media
        public List<IFormFile> Images { get; set; } = new();

        public IFormFile? Video { get; set; }

        // Product descriptions
        public string ShortDescription { get; set; } = string.Empty;

        public string ProductDetails { get; set; } = string.Empty;

        public string PackageIncludes { get; set; } = string.Empty;

        // Product specifications
        public string Weight { get; set; } = string.Empty;

        public string Dimensions { get; set; } = string.Empty;

        public string PowerSource { get; set; } = string.Empty;

        public string Material { get; set; } = string.Empty;

        public string CoverageUsage { get; set; } = string.Empty;

        public string? Specifications { get; set; }

        // Origin and delivery
        public string CountryOfOrigin { get; set; } = string.Empty;

        public string EstimatedDelivery { get; set; } = string.Empty;

        public string DeliveryReturn { get; set; } = string.Empty;

        // Discount details
        public string DiscountType { get; set; } = string.Empty;

        public decimal DiscountAmount { get; set; }

        // Inventory status
        public string? StockStatus { get; set; }

        // Cash on Delivery availability
        public bool CODAvailability { get; set; }
    }
}
