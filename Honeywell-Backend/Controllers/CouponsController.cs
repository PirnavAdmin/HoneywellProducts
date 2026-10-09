using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Honeywell.Data;
using Honeywell.Models;

namespace Honeywell.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CouponsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CouponsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private async Task<string?> SaveUploadedFileAsync(IFormFile? file)
        {
            if (file == null || file.Length == 0)
                return null;

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            var request = HttpContext.Request;
            var hostUrl = $"{request.Scheme}://{request.Host}";
            return $"{hostUrl}/uploads/{uniqueFileName}";
        }

        private async Task<Coupon> GetCouponFromFormAsync()
        {
            var form = await Request.ReadFormAsync();
            var coupon = new Coupon();

            if (form.TryGetValue("Id", out var idVal) && int.TryParse(idVal, out var id)) coupon.Id = id;
            if (form.TryGetValue("Code", out var codeVal)) coupon.Code = codeVal.ToString();
            if (form.TryGetValue("DiscountType", out var dtVal)) coupon.DiscountType = dtVal.ToString();
            if (form.TryGetValue("DiscountValue", out var dvVal) && decimal.TryParse(dvVal, out var dv)) coupon.DiscountValue = dv;
            if (form.TryGetValue("MinCartValue", out var mcvVal) && decimal.TryParse(mcvVal, out var mcv)) coupon.MinCartValue = mcv;
            if (form.TryGetValue("UsageLimit", out var ulVal) && int.TryParse(ulVal, out var ul)) coupon.UsageLimit = ul;
            if (form.TryGetValue("UsedCount", out var ucVal) && int.TryParse(ucVal, out var uc)) coupon.UsedCount = uc;
            if (form.TryGetValue("StartDate", out var sdVal) && DateTime.TryParse(sdVal, out var sd)) coupon.StartDate = sd;
            if (form.TryGetValue("EndDate", out var edVal) && DateTime.TryParse(edVal, out var ed)) coupon.EndDate = ed;
            
            if (form.TryGetValue("IsActive", out var activeStr))
            {
                var s = activeStr.ToString();
                coupon.IsActive = s == "1" || s.Equals("true", StringComparison.OrdinalIgnoreCase);
            }

            if (form.TryGetValue("Title", out var titleVal)) coupon.Title = titleVal.ToString();
            if (form.TryGetValue("Description", out var descVal)) coupon.Description = descVal.ToString();
            if (form.TryGetValue("TermsAndConditions", out var tacVal)) coupon.TermsAndConditions = tacVal.ToString();
            if (form.TryGetValue("MaxDiscountAmount", out var mdaVal) && decimal.TryParse(mdaVal, out var mda)) coupon.MaxDiscountAmount = mda;

            // Existing URLs fallback
            if (form.TryGetValue("BackgroundImageUrl", out var bgUrl)) coupon.BackgroundImageUrl = bgUrl.ToString();
            if (form.TryGetValue("BannerImageUrl", out var bnUrl)) coupon.BannerImageUrl = bnUrl.ToString();
            if (form.TryGetValue("ThumbnailImageUrl", out var tbUrl)) coupon.ThumbnailImageUrl = tbUrl.ToString();

            // Image Uploads
            var bgFile = form.Files.GetFile("BackgroundImageFile") ?? form.Files.GetFile("BackgroundImage");
            var bnFile = form.Files.GetFile("BannerImageFile") ?? form.Files.GetFile("BannerImage");
            var tbFile = form.Files.GetFile("ThumbnailImageFile") ?? form.Files.GetFile("ThumbnailImage");

            var bgUploaded = await SaveUploadedFileAsync(bgFile);
            var bnUploaded = await SaveUploadedFileAsync(bnFile);
            var tbUploaded = await SaveUploadedFileAsync(tbFile);

            if (!string.IsNullOrEmpty(bgUploaded)) coupon.BackgroundImageUrl = bgUploaded;
            if (!string.IsNullOrEmpty(bnUploaded)) coupon.BannerImageUrl = bnUploaded;
            if (!string.IsNullOrEmpty(tbUploaded)) coupon.ThumbnailImageUrl = tbUploaded;

            return coupon;
        }

        // GET: api/Coupons
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Coupon>>> GetAll()
        {
            var list = await _context.Coupons.ToListAsync();
            foreach (var c in list)
            {
                if (string.IsNullOrEmpty(c.BackgroundImageUrl)) c.BackgroundImageUrl = null;
                if (string.IsNullOrEmpty(c.BannerImageUrl)) c.BannerImageUrl = null;
                if (string.IsNullOrEmpty(c.ThumbnailImageUrl)) c.ThumbnailImageUrl = null;
            }
            return Ok(list);
        }

        // GET: api/Coupons/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Coupon>> GetById(int id)
        {
            var coupon = await _context.Coupons.FindAsync(id);
            if (coupon == null)
            {
                return NotFound(new { Message = "Coupon not found." });
            }

            if (string.IsNullOrEmpty(coupon.BackgroundImageUrl)) coupon.BackgroundImageUrl = null;
            if (string.IsNullOrEmpty(coupon.BannerImageUrl)) coupon.BannerImageUrl = null;
            if (string.IsNullOrEmpty(coupon.ThumbnailImageUrl)) coupon.ThumbnailImageUrl = null;

            return Ok(coupon);
        }

        // POST: api/Coupons
        [HttpPost]
        public async Task<ActionResult<Coupon>> Create()
        {
            Coupon coupon;
            if (Request.HasFormContentType)
            {
                coupon = await GetCouponFromFormAsync();
            }
            else
            {
                try
                {
                    if (Request.ContentLength == null || Request.ContentLength == 0)
                    {
                        coupon = new Coupon();
                    }
                    else
                    {
                        coupon = await System.Text.Json.JsonSerializer.DeserializeAsync<Coupon>(Request.Body, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new Coupon();
                    }
                }
                catch (System.Text.Json.JsonException)
                {
                    coupon = new Coupon();
                }
            }

            if (string.IsNullOrEmpty(coupon.Code))
            {
                return BadRequest(new { Message = "Coupon Code is required." });
            }

            var exists = await _context.Coupons.AnyAsync(c => c.Code == coupon.Code);
            if (exists)
            {
                return BadRequest(new { Message = $"Coupon with code '{coupon.Code}' already exists." });
            }

            // Normalize image URLs to null if they are empty
            if (string.IsNullOrEmpty(coupon.BackgroundImageUrl)) coupon.BackgroundImageUrl = null;
            if (string.IsNullOrEmpty(coupon.BannerImageUrl)) coupon.BannerImageUrl = null;
            if (string.IsNullOrEmpty(coupon.ThumbnailImageUrl)) coupon.ThumbnailImageUrl = null;

            coupon.CreatedDate = DateTime.UtcNow;
            coupon.UpdatedDate = null;

            _context.Coupons.Add(coupon);

            var notification = new Notification
            {
                Title = "Coupon Created",
                Message = $"New coupon '{coupon.Code}' created.",
                Type = "CouponCreated",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = coupon.Id }, coupon);
        }

        // PUT: api/Coupons/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id)
        {
            Coupon updateData;
            if (Request.HasFormContentType)
            {
                updateData = await GetCouponFromFormAsync();
            }
            else
            {
                try
                {
                    if (Request.ContentLength == null || Request.ContentLength == 0)
                    {
                        updateData = new Coupon();
                    }
                    else
                    {
                        updateData = await System.Text.Json.JsonSerializer.DeserializeAsync<Coupon>(Request.Body, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new Coupon();
                    }
                }
                catch (System.Text.Json.JsonException)
                {
                    updateData = new Coupon();
                }
            }

            var coupon = await _context.Coupons.FindAsync(id);
            if (coupon == null)
            {
                return NotFound(new { Message = "Coupon not found." });
            }

            coupon.Code = updateData.Code;
            coupon.DiscountType = updateData.DiscountType;
            coupon.DiscountValue = updateData.DiscountValue;
            coupon.MinCartValue = updateData.MinCartValue;
            coupon.UsageLimit = updateData.UsageLimit;
            coupon.UsedCount = updateData.UsedCount;
            coupon.StartDate = updateData.StartDate;
            coupon.EndDate = updateData.EndDate;
            coupon.IsActive = updateData.IsActive;

            // Update extended fields
            coupon.Title = updateData.Title;
            coupon.Description = updateData.Description;
            coupon.TermsAndConditions = updateData.TermsAndConditions;
            coupon.MaxDiscountAmount = updateData.MaxDiscountAmount;

            // Normalize image URLs
            coupon.BackgroundImageUrl = string.IsNullOrEmpty(updateData.BackgroundImageUrl) ? null : updateData.BackgroundImageUrl;
            coupon.BannerImageUrl = string.IsNullOrEmpty(updateData.BannerImageUrl) ? null : updateData.BannerImageUrl;
            coupon.ThumbnailImageUrl = string.IsNullOrEmpty(updateData.ThumbnailImageUrl) ? null : updateData.ThumbnailImageUrl;

            coupon.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/Coupons/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var coupon = await _context.Coupons.FindAsync(id);
            if (coupon == null)
            {
                return NotFound(new { Message = "Coupon not found." });
            }

            _context.Coupons.Remove(coupon);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // GET: api/Coupons/validate?code=SAVE10&cartTotal=500
        [HttpGet("validate")]
        public async Task<ActionResult<object>> ValidateCoupon([FromQuery] string code, [FromQuery] decimal? cartTotal, [FromQuery] decimal? cartValue)
        {
            decimal total = cartTotal ?? cartValue ?? 0.0m;

            if (string.IsNullOrEmpty(code))
            {
                return BadRequest(new { success = false, message = "Coupon code is required." });
            }

            var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Code == code);
            if (coupon == null)
            {
                return Ok(new { success = false, message = "Coupon is expired or not applicable" });
            }

            if (!coupon.IsActive)
            {
                return Ok(new { success = false, message = "Coupon is expired or not applicable" });
            }

            DateTime now = DateTime.UtcNow;
            if (now < coupon.StartDate || now > coupon.EndDate)
            {
                // Push expired notification if not already done
                var notifExists = await _context.Notifications.AnyAsync(n => n.Type == "CouponExpired" && n.Message.Contains(coupon.Code));
                if (!notifExists && now > coupon.EndDate)
                {
                    _context.Notifications.Add(new Notification
                    {
                        Title = "Coupon Expired",
                        Message = $"Coupon '{coupon.Code}' has expired.",
                        Type = "CouponExpired",
                        CreatedAt = DateTime.UtcNow,
                        IsRead = false
                    });
                    await _context.SaveChangesAsync();
                }
                return Ok(new { success = false, message = "Coupon is expired or not applicable" });
            }

            if (coupon.UsedCount >= coupon.UsageLimit)
            {
                var notifExists = await _context.Notifications.AnyAsync(n => n.Type == "CouponLimitReached" && n.Message.Contains(coupon.Code));
                if (!notifExists)
                {
                    _context.Notifications.Add(new Notification
                    {
                        Title = "Coupon Limit Reached",
                        Message = $"Coupon '{coupon.Code}' has reached its usage limit.",
                        Type = "CouponLimitReached",
                        CreatedAt = DateTime.UtcNow,
                        IsRead = false
                    });
                    await _context.SaveChangesAsync();
                }
                return Ok(new { success = false, message = "Coupon is expired or not applicable" });
            }

            if (total < coupon.MinCartValue)
            {
                return Ok(new { success = false, message = "Coupon is expired or not applicable" });
            }

            // Calculate discount amount
            decimal discount = 0;
            if (coupon.DiscountType.Equals("Percentage", StringComparison.OrdinalIgnoreCase))
            {
                discount = Math.Round(total * (coupon.DiscountValue / 100.0m), 2);
            }
            else // FixedAmount
            {
                discount = coupon.DiscountValue;
            }

            // Apply max discount cap constraint
            if (coupon.MaxDiscountAmount.HasValue && coupon.MaxDiscountAmount.Value > 0)
            {
                if (discount > coupon.MaxDiscountAmount.Value)
                {
                    discount = coupon.MaxDiscountAmount.Value;
                }
            }

            if (discount > total)
            {
                discount = total;
            }

            decimal finalAmount = total - discount;

            return Ok(new
            {
                success = true,
                message = "Coupon applied successfully",
                couponId = coupon.Id,
                code = coupon.Code,
                discountType = coupon.DiscountType,
                discountValue = coupon.DiscountValue,
                discountAmount = discount,
                minCartValue = coupon.MinCartValue,
                maxDiscountAmount = coupon.MaxDiscountAmount ?? 0.0m,
                cartTotal = total,
                finalAmount = finalAmount,
                startDate = coupon.StartDate,
                endDate = coupon.EndDate,
                isActive = coupon.IsActive
            });
        }
    }
}
