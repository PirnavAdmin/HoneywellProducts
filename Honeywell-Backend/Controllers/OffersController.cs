using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Honeywell.Data;
using Honeywell.Models;

namespace Honeywell.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OffersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OffersController(ApplicationDbContext context)
        {
            _context = context;
        }

        private async Task EnsureTableCreatedAsync()
        {
            try
            {
                var sql = @"
                CREATE TABLE IF NOT EXISTS `Offers` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `Title` VARCHAR(255) NOT NULL,
                    `Category` VARCHAR(100) NOT NULL,
                    `BadgeTag` VARCHAR(50) NOT NULL DEFAULT 'SPECIAL PRICE',
                    `OriginalPrice` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                    `DealPrice` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                    `DiscountPercentage` INT NOT NULL DEFAULT 0,
                    `Description` TEXT,
                    `ImageUrl` VARCHAR(500),
                    `EndDate` DATETIME NOT NULL,
                    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
                    `DisplayOrder` INT NOT NULL DEFAULT 0,
                    `CreatedAt` DATETIME NOT NULL,
                    `ProductId` INT NULL
                );";
                await _context.Database.ExecuteSqlRawAsync(sql);

                // Safely add missing columns
                var alterColumns = new[]
                {
                    "ALTER TABLE `Offers` ADD COLUMN `DealType` VARCHAR(50) NOT NULL DEFAULT 'ProductOffer';",
                    "ALTER TABLE `Offers` ADD COLUMN `CategoryId` INT NULL;",
                    "ALTER TABLE `Offers` ADD COLUMN `SubcategoryId` INT NULL;",
                    "ALTER TABLE `Offers` ADD COLUMN `DiscountType` VARCHAR(50) NOT NULL DEFAULT 'Percentage';",
                    "ALTER TABLE `Offers` ADD COLUMN `DiscountValue` DECIMAL(18,2) NOT NULL DEFAULT 0.00;",
                    "ALTER TABLE `Offers` ADD COLUMN `StartDate` DATETIME NULL;",
                    "ALTER TABLE `Offers` ADD COLUMN `ImageSource` VARCHAR(50) NOT NULL DEFAULT 'CustomBanner';",
                    "ALTER TABLE `Offers` ADD COLUMN `IsFeatured` TINYINT(1) NOT NULL DEFAULT 0;",
                    "ALTER TABLE `Offers` ADD COLUMN `ShowDiscountBadge` TINYINT(1) NOT NULL DEFAULT 1;",
                    "ALTER TABLE `Offers` ADD COLUMN `ShowCountdownTimer` TINYINT(1) NOT NULL DEFAULT 1;"
                };

                foreach (var alter in alterColumns)
                {
                    try { await _context.Database.ExecuteSqlRawAsync(alter); } catch { /* column already exists */ }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[OffersController Error] Table creation check: {ex.Message}");
            }
        }

        private static object MapOfferResponse(Offer o)
        {
            var productImg = o.Product?.Images?.FirstOrDefault()?.ImageUrl ?? string.Empty;
            return new
            {
                id = o.Id,
                offerId = o.Id,
                title = o.Title,
                offerTitle = o.Title,
                category = o.Category,
                badgeTag = o.BadgeTag,
                promotionalTag = o.BadgeTag,
                originalPrice = o.OriginalPrice,
                originalMrp = o.OriginalPrice,
                dealPrice = o.DealPrice,
                offerPrice = o.DealPrice,
                discountPercentage = o.DiscountPercentage,
                description = o.Description,
                imageUrl = o.ImageUrl,
                endDate = o.EndDate,
                expiryDateTime = o.EndDate,
                startDate = o.StartDate,
                startDateTime = o.StartDate,
                isActive = o.IsActive,
                displayOrder = o.DisplayOrder,
                createdAt = o.CreatedAt,
                productId = o.ProductId,
                dealType = o.DealType,
                categoryId = o.CategoryId,
                subcategoryId = o.SubcategoryId,
                discountType = o.DiscountType,
                discountValue = o.DiscountValue,
                imageSource = o.ImageSource,
                isFeatured = o.IsFeatured,
                showDiscountBadge = o.ShowDiscountBadge,
                showCountdownTimer = o.ShowCountdownTimer,
                product = o.Product != null ? new
                {
                    productId = o.Product.Id,
                    productName = o.Product.ProductName,
                    sku = o.Product.SKU,
                    brandName = o.Product.Brand,
                    categoryName = o.Product.Category?.Name ?? string.Empty,
                    subcategoryName = o.Product.Subcategory?.Name ?? string.Empty,
                    primaryImageUrl = productImg
                } : null
            };
        }

        // GET: api/Offers (Public Active Offers)
        [HttpGet]
        public async Task<IActionResult> GetActiveOffers([FromQuery] string? category)
        {
            await EnsureTableCreatedAsync();

            var now = DateTime.UtcNow;
            var query = _context.Offers
                .Include(o => o.Product)
                    .ThenInclude(p => p!.Category)
                .Include(o => o.Product)
                    .ThenInclude(p => p!.Subcategory)
                .Include(o => o.Product)
                    .ThenInclude(p => p!.Images)
                .Where(o => o.IsActive)
                .Where(o => !o.StartDate.HasValue || o.StartDate.Value <= now)
                .Where(o => o.EndDate > now);

            if (!string.IsNullOrWhiteSpace(category) && category.ToLower() != "all")
            {
                query = query.Where(o => o.Category.ToLower() == category.Trim().ToLower());
            }

            var offers = await query
                .OrderBy(o => o.DisplayOrder)
                .ThenByDescending(o => o.CreatedAt)
                .ToListAsync();

            var result = offers.Select(MapOfferResponse).ToList();
            return Ok(result);
        }

        // GET: api/Offers/admin (Admin All Offers)
        [HttpGet("admin")]
        public async Task<IActionResult> GetAllOffersAdmin()
        {
            await EnsureTableCreatedAsync();

            var offers = await _context.Offers
                .Include(o => o.Product)
                    .ThenInclude(p => p!.Category)
                .Include(o => o.Product)
                    .ThenInclude(p => p!.Subcategory)
                .Include(o => o.Product)
                    .ThenInclude(p => p!.Images)
                .OrderBy(o => o.DisplayOrder)
                .ThenByDescending(o => o.CreatedAt)
                .ToListAsync();

            var result = offers.Select(MapOfferResponse).ToList();
            return Ok(result);
        }

        // DELETE: api/Offers/clear-all (Admin Clear All Offers)
        [HttpDelete("clear-all")]
        public async Task<IActionResult> ClearAllOffers()
        {
            await EnsureTableCreatedAsync();
            try
            {
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM `Offers`;");
                return Ok(new { success = true, message = "All offers removed successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // GET: api/Offers/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetOfferById(int id)
        {
            await EnsureTableCreatedAsync();
            var offer = await _context.Offers
                .Include(o => o.Product)
                    .ThenInclude(p => p!.Category)
                .Include(o => o.Product)
                    .ThenInclude(p => p!.Subcategory)
                .Include(o => o.Product)
                    .ThenInclude(p => p!.Images)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (offer == null)
            {
                return NotFound(new { success = false, message = "Offer not found." });
            }
            return Ok(MapOfferResponse(offer));
        }

        // POST: api/Offers (Admin Create Offer)
        [HttpPost]
        public async Task<IActionResult> CreateOffer([FromBody] Offer offer)
        {
            await EnsureTableCreatedAsync();

            if (offer == null || string.IsNullOrWhiteSpace(offer.Title))
            {
                return BadRequest(new { success = false, message = "Offer title is required." });
            }

            // Validate Product relationship if ProductId provided or DealType is ProductOffer
            if (string.Equals(offer.DealType, "ProductOffer", StringComparison.OrdinalIgnoreCase) || (offer.ProductId.HasValue && offer.ProductId.Value > 0))
            {
                if (!offer.ProductId.HasValue || offer.ProductId.Value <= 0)
                {
                    return BadRequest(new { success = false, message = "ProductId is required for ProductOffer." });
                }

                var product = await _context.Products
                    .Include(p => p.Category)
                    .Include(p => p.Subcategory)
                    .Include(p => p.Images)
                    .FirstOrDefaultAsync(p => p.Id == offer.ProductId.Value && p.IsActive);

                if (product == null)
                {
                    return BadRequest(new { success = false, message = $"Product with ID {offer.ProductId} does not exist or is inactive." });
                }

                // If ImageSource is ProductImage, fallback to product image if offer ImageUrl is empty
                if (string.Equals(offer.ImageSource, "ProductImage", StringComparison.OrdinalIgnoreCase) || string.IsNullOrWhiteSpace(offer.ImageUrl))
                {
                    var primaryImg = product.Images?.FirstOrDefault()?.ImageUrl;
                    if (!string.IsNullOrWhiteSpace(primaryImg))
                    {
                        offer.ImageUrl = primaryImg;
                    }
                }
            }

            // Price validation
            if (offer.OriginalPrice <= 0)
            {
                return BadRequest(new { success = false, message = "Original price must be greater than 0." });
            }

            if (offer.DealPrice <= 0)
            {
                return BadRequest(new { success = false, message = "Deal price must be greater than 0." });
            }

            if (offer.DealPrice >= offer.OriginalPrice)
            {
                return BadRequest(new { success = false, message = "Deal price must be less than original MRP." });
            }

            // Discount calculation & validation
            if (string.Equals(offer.DiscountType, "Percentage", StringComparison.OrdinalIgnoreCase))
            {
                if (offer.DiscountValue > 0)
                {
                    if (offer.DiscountValue > 100)
                    {
                        return BadRequest(new { success = false, message = "Percentage discount value cannot exceed 100%." });
                    }
                    offer.DiscountPercentage = (int)Math.Round(offer.DiscountValue);
                }
                else if (offer.OriginalPrice > 0 && offer.DealPrice > 0)
                {
                    offer.DiscountPercentage = (int)Math.Round((1 - (offer.DealPrice / offer.OriginalPrice)) * 100);
                    offer.DiscountValue = offer.DiscountPercentage;
                }
            }
            else if (string.Equals(offer.DiscountType, "Flat", StringComparison.OrdinalIgnoreCase))
            {
                if (offer.DiscountValue > 0 && offer.DiscountValue >= offer.OriginalPrice)
                {
                    return BadRequest(new { success = false, message = "Flat discount value must be less than original MRP." });
                }
                if (offer.OriginalPrice > 0)
                {
                    offer.DiscountPercentage = (int)Math.Round((offer.DiscountValue / offer.OriginalPrice) * 100);
                }
            }
            else
            {
                if (offer.OriginalPrice > 0 && offer.DealPrice > 0 && offer.DiscountPercentage <= 0)
                {
                    offer.DiscountPercentage = (int)Math.Round((1 - (offer.DealPrice / offer.OriginalPrice)) * 100);
                }
            }

            // Date validation
            if (offer.StartDate.HasValue && offer.EndDate <= offer.StartDate.Value)
            {
                return BadRequest(new { success = false, message = "Expiry date time must be later than start date time." });
            }

            if (offer.CreatedAt == default)
            {
                offer.CreatedAt = DateTime.UtcNow;
            }

            _context.Offers.Add(offer);
            await _context.SaveChangesAsync();

            // Reload offer with navigation properties for response
            var createdOffer = await _context.Offers
                .Include(o => o.Product)
                    .ThenInclude(p => p!.Category)
                .Include(o => o.Product)
                    .ThenInclude(p => p!.Subcategory)
                .Include(o => o.Product)
                    .ThenInclude(p => p!.Images)
                .FirstOrDefaultAsync(o => o.Id == offer.Id);

            return CreatedAtAction(nameof(GetOfferById), new { id = offer.Id }, new
            {
                success = true,
                message = "Offer created successfully.",
                offer = MapOfferResponse(createdOffer ?? offer)
            });
        }

        // PUT: api/Offers/{id} (Admin Update Offer)
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateOffer(int id, [FromBody] Offer updatedOffer)
        {
            await EnsureTableCreatedAsync();
            var existing = await _context.Offers.FindAsync(id);
            if (existing == null)
            {
                return NotFound(new { success = false, message = "Offer not found." });
            }

            // Validate Product relationship if ProductId provided or DealType is ProductOffer
            if (string.Equals(updatedOffer.DealType, "ProductOffer", StringComparison.OrdinalIgnoreCase) || (updatedOffer.ProductId.HasValue && updatedOffer.ProductId.Value > 0))
            {
                if (!updatedOffer.ProductId.HasValue || updatedOffer.ProductId.Value <= 0)
                {
                    return BadRequest(new { success = false, message = "ProductId is required for ProductOffer." });
                }

                var product = await _context.Products
                    .Include(p => p.Category)
                    .Include(p => p.Subcategory)
                    .Include(p => p.Images)
                    .FirstOrDefaultAsync(p => p.Id == updatedOffer.ProductId.Value && p.IsActive);

                if (product == null)
                {
                    return BadRequest(new { success = false, message = $"Product with ID {updatedOffer.ProductId} does not exist or is inactive." });
                }

                // If ImageSource is ProductImage, fallback to product image if offer ImageUrl is empty
                if (string.Equals(updatedOffer.ImageSource, "ProductImage", StringComparison.OrdinalIgnoreCase) || string.IsNullOrWhiteSpace(updatedOffer.ImageUrl))
                {
                    var primaryImg = product.Images?.FirstOrDefault()?.ImageUrl;
                    if (!string.IsNullOrWhiteSpace(primaryImg))
                    {
                        updatedOffer.ImageUrl = primaryImg;
                    }
                }
            }

            // Price validation
            if (updatedOffer.OriginalPrice <= 0)
            {
                return BadRequest(new { success = false, message = "Original price must be greater than 0." });
            }

            if (updatedOffer.DealPrice <= 0)
            {
                return BadRequest(new { success = false, message = "Deal price must be greater than 0." });
            }

            if (updatedOffer.DealPrice >= updatedOffer.OriginalPrice)
            {
                return BadRequest(new { success = false, message = "Deal price must be less than original MRP." });
            }

            // Date validation
            if (updatedOffer.StartDate.HasValue && updatedOffer.EndDate <= updatedOffer.StartDate.Value)
            {
                return BadRequest(new { success = false, message = "Expiry date time must be later than start date time." });
            }

            existing.Title = updatedOffer.Title;
            existing.Category = updatedOffer.Category;
            existing.BadgeTag = updatedOffer.BadgeTag;
            existing.OriginalPrice = updatedOffer.OriginalPrice;
            existing.DealPrice = updatedOffer.DealPrice;
            existing.DiscountPercentage = updatedOffer.DiscountPercentage > 0 ? updatedOffer.DiscountPercentage : (existing.OriginalPrice > 0 ? (int)Math.Round((1 - (existing.DealPrice / existing.OriginalPrice)) * 100) : 0);
            existing.Description = updatedOffer.Description;
            existing.ImageUrl = updatedOffer.ImageUrl;
            existing.EndDate = updatedOffer.EndDate;
            existing.StartDate = updatedOffer.StartDate;
            existing.IsActive = updatedOffer.IsActive;
            existing.DisplayOrder = updatedOffer.DisplayOrder;
            existing.ProductId = updatedOffer.ProductId;
            existing.DealType = updatedOffer.DealType;
            existing.CategoryId = updatedOffer.CategoryId;
            existing.SubcategoryId = updatedOffer.SubcategoryId;
            existing.DiscountType = updatedOffer.DiscountType;
            existing.DiscountValue = updatedOffer.DiscountValue;
            existing.ImageSource = updatedOffer.ImageSource;
            existing.IsFeatured = updatedOffer.IsFeatured;
            existing.ShowDiscountBadge = updatedOffer.ShowDiscountBadge;
            existing.ShowCountdownTimer = updatedOffer.ShowCountdownTimer;

            await _context.SaveChangesAsync();

            var reloadedOffer = await _context.Offers
                .Include(o => o.Product)
                    .ThenInclude(p => p!.Category)
                .Include(o => o.Product)
                    .ThenInclude(p => p!.Subcategory)
                .Include(o => o.Product)
                    .ThenInclude(p => p!.Images)
                .FirstOrDefaultAsync(o => o.Id == existing.Id);

            return Ok(new
            {
                success = true,
                message = "Offer updated successfully.",
                offer = MapOfferResponse(reloadedOffer ?? existing)
            });
        }

        // PATCH: api/Offers/{id}/status (Admin Toggle Status)
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            await EnsureTableCreatedAsync();
            var offer = await _context.Offers.FindAsync(id);
            if (offer == null)
            {
                return NotFound(new { success = false, message = "Offer not found." });
            }

            offer.IsActive = !offer.IsActive;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"Offer status updated to {(offer.IsActive ? "Active" : "Inactive")}.",
                isActive = offer.IsActive
            });
        }

        // DELETE: api/Offers/{id} (Admin Delete Offer)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOffer(int id)
        {
            await EnsureTableCreatedAsync();
            var offer = await _context.Offers.FindAsync(id);
            if (offer == null)
            {
                return NotFound(new { success = false, message = "Offer not found." });
            }

            _context.Offers.Remove(offer);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Offer deleted successfully." });
        }
    }
}
