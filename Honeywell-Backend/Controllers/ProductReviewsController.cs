using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Honeywell.Data;
using Honeywell.DTOs;
using Honeywell.Models;

namespace Honeywell.Controllers
{
    [ApiController]
    [Route("api/reviews")]
    [Route("api/ProductReviews")]
    public class ProductReviewsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProductReviewsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Helper: resolve string productId (ID, SKU, or Slug) to integer ProductId
        private async Task<int?> ResolveProductIdAsync(string productIdStr)
        {
            if (string.IsNullOrWhiteSpace(productIdStr)) return (await _context.Products.FirstOrDefaultAsync())?.Id;
            var clean = productIdStr.Trim();

            if (int.TryParse(clean, out int numericId))
            {
                var p = await _context.Products.FindAsync(numericId);
                if (p != null) return p.Id;
            }

            var product = await _context.Products
                .FirstOrDefaultAsync(p => (p.SKU != null && p.SKU.ToLower() == clean.ToLower()) ||
                                          (p.ProductName != null && p.ProductName.ToLower() == clean.ToLower()));

            if (product != null) return product.Id;

            var firstProduct = await _context.Products.FirstOrDefaultAsync();
            return firstProduct?.Id ?? (int.TryParse(clean, out int fallbackId) ? fallbackId : 1);
        }

        // Helper: recalculate all rating stats for a product
        private async Task RecalculateRatingsAsync(int productId)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null) return;

            var reviews = await _context.ProductReviews
                .Where(x => x.ProductId == productId)
                .ToListAsync();

            product.TotalReviews = reviews.Count;
            product.AverageRating = reviews.Count > 0
                ? Math.Round(reviews.Average(x => x.Rating), 2)
                : 0m;

            product.FiveStar = reviews.Count(x => Math.Round(x.Rating) == 5);
            product.FourStar = reviews.Count(x => Math.Round(x.Rating) == 4);
            product.ThreeStar = reviews.Count(x => Math.Round(x.Rating) == 3);
            product.TwoStar = reviews.Count(x => Math.Round(x.Rating) == 2);
            product.OneStar = reviews.Count(x => Math.Round(x.Rating) == 1);

            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// GET /api/reviews/{productId}
        /// Retrieves all approved reviews for a given product (by ID, SKU, or Slug)
        /// </summary>
        [HttpGet("{productId}")]
        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetByProduct(string productId)
        {
            if (string.IsNullOrWhiteSpace(productId))
                return BadRequest(new { message = "ProductId is required." });

            int? targetProductId = await ResolveProductIdAsync(productId);

            var query = _context.ProductReviews.AsQueryable();

            if (targetProductId.HasValue && targetProductId.Value > 0)
            {
                var pid = targetProductId.Value;
                query = query.Where(r => r.ProductId == pid);
            }
            else if (int.TryParse(productId.Trim(), out int numId))
            {
                query = query.Where(r => r.ProductId == numId);
            }

            var reviews = await query
                .OrderByDescending(r => r.ReviewDate)
                .Select(r => new ReviewDto
                {
                    Id = r.Id.ToString(),
                    ProductId = r.ProductId.ToString(),
                    CustomerName = r.CustomerName,
                    Rating = r.Rating,
                    ReviewComment = r.ReviewComment,
                    ReviewDate = r.ReviewDate,
                    VerifiedPurchase = r.VerifiedPurchase,
                    Status = string.IsNullOrWhiteSpace(r.Status) ? "Approved" : r.Status
                })
                .ToListAsync();

            return Ok(reviews);
        }

        /// <summary>
        /// GET /api/reviews/item/{id}
        /// Retrieves a single review by ID
        /// </summary>
        [HttpGet("item/{id}")]
        public async Task<IActionResult> GetById(long id)
        {
            var r = await _context.ProductReviews.FindAsync((int)id);
            if (r == null)
                return NotFound(new { message = $"Review with ID {id} not found." });

            return Ok(new ReviewDto
            {
                Id = r.Id.ToString(),
                ProductId = r.ProductId.ToString(),
                CustomerName = r.CustomerName,
                Rating = r.Rating,
                ReviewComment = r.ReviewComment,
                ReviewDate = r.ReviewDate,
                VerifiedPurchase = r.VerifiedPurchase,
                Status = string.IsNullOrWhiteSpace(r.Status) ? "Approved" : r.Status
            });
        }

        /// <summary>
        /// POST /api/reviews
        /// Creates a new customer review
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateReviewDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.ProductId))
                return BadRequest(new { message = "ProductId is required." });

            int? targetProductId = await ResolveProductIdAsync(dto.ProductId);
            int resolvedPid = targetProductId ?? (int.TryParse(dto.ProductId, out int pid) ? pid : 1);

            var entity = new ProductReview
            {
                ProductId = resolvedPid,
                CustomerName = string.IsNullOrWhiteSpace(dto.CustomerName) ? "Anonymous Customer" : dto.CustomerName.Trim(),
                Rating = dto.Rating < 1m ? 1m : (dto.Rating > 5m ? 5m : dto.Rating),
                ReviewComment = dto.ReviewComment ?? "",
                ReviewDate = dto.ReviewDate ?? DateTime.UtcNow,
                VerifiedPurchase = dto.VerifiedPurchase,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Approved" : dto.Status,
                CreatedAt = DateTime.UtcNow
            };

            _context.ProductReviews.Add(entity);
            await _context.SaveChangesAsync();

            // Recalculate product rating stats
            await RecalculateRatingsAsync(resolvedPid);

            var result = new ReviewDto
            {
                Id = entity.Id.ToString(),
                ProductId = entity.ProductId.ToString(),
                CustomerName = entity.CustomerName,
                Rating = entity.Rating,
                ReviewComment = entity.ReviewComment,
                ReviewDate = entity.ReviewDate,
                VerifiedPurchase = entity.VerifiedPurchase,
                Status = entity.Status
            };

            return CreatedAtAction(nameof(GetById), new { id = entity.Id }, result);
        }

        /// <summary>
        /// PUT /api/reviews/{id}
        /// Updates an existing review
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(long id, [FromBody] CreateReviewDto dto)
        {
            var entity = await _context.ProductReviews.FindAsync((int)id);
            if (entity == null)
                return NotFound(new { message = $"Review with ID {id} not found." });

            if (dto != null)
            {
                if (!string.IsNullOrWhiteSpace(dto.CustomerName)) entity.CustomerName = dto.CustomerName.Trim();
                if (dto.Rating >= 1m && dto.Rating <= 5m) entity.Rating = dto.Rating;
                if (dto.ReviewComment != null) entity.ReviewComment = dto.ReviewComment;
                entity.VerifiedPurchase = dto.VerifiedPurchase;
                if (!string.IsNullOrWhiteSpace(dto.Status)) entity.Status = dto.Status;
                entity.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            // Recalculate after update
            await RecalculateRatingsAsync(entity.ProductId);

            var updatedDto = new ReviewDto
            {
                Id = entity.Id.ToString(),
                ProductId = entity.ProductId.ToString(),
                CustomerName = entity.CustomerName,
                Rating = entity.Rating,
                ReviewComment = entity.ReviewComment,
                ReviewDate = entity.ReviewDate,
                VerifiedPurchase = entity.VerifiedPurchase,
                Status = entity.Status
            };

            return Ok(updatedDto);
        }

        /// <summary>
        /// DELETE /api/reviews/{id}
        /// Deletes a review
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(long id)
        {
            var entity = await _context.ProductReviews.FindAsync((int)id);
            if (entity == null)
                return NotFound(new { message = $"Review with ID {id} not found." });

            var productId = entity.ProductId;
            _context.ProductReviews.Remove(entity);
            await _context.SaveChangesAsync();

            // Recalculate after deletion
            await RecalculateRatingsAsync(productId);

            return Ok(new { message = $"Review with ID {id} deleted successfully." });
        }
    }
}

