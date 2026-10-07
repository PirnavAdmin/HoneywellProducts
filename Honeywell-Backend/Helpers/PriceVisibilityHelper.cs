using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Honeywell.Data;
using Honeywell.Models;

namespace Honeywell.Helpers
{
    public static class PriceVisibilityHelper
    {
        public static async Task<bool> IsPriceVisibilityEnabledAsync(ApplicationDbContext context)
        {
            try
            {
                var item = await context.SystemConfigs
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Key == "product_price_visibility" || c.Key == "price_visibility");

                if (item == null || string.IsNullOrWhiteSpace(item.JsonValue))
                {
                    return true; // Default to ON if unconfigured
                }

                using var doc = JsonDocument.Parse(item.JsonValue);
                var root = doc.RootElement;
                if (root.ValueKind == JsonValueKind.True) return true;
                if (root.ValueKind == JsonValueKind.False) return false;
                if (root.ValueKind == JsonValueKind.Object)
                {
                    if (root.TryGetProperty("enabled", out var prop) || root.TryGetProperty("Enabled", out prop) ||
                        root.TryGetProperty("priceVisibility", out prop) || root.TryGetProperty("PriceVisibility", out prop))
                    {
                        if (prop.ValueKind == JsonValueKind.True) return true;
                        if (prop.ValueKind == JsonValueKind.False) return false;
                        if (prop.ValueKind == JsonValueKind.String && bool.TryParse(prop.GetString(), out var pBool)) return pBool;
                    }
                }
                if (root.ValueKind == JsonValueKind.String && bool.TryParse(root.GetString(), out var sBool))
                {
                    return sBool;
                }
            }
            catch
            {
                return true;
            }

            return true;
        }

        public static bool CanPurchaseProduct(Product? product, bool priceVisibilityEnabled)
        {
            if (!priceVisibilityEnabled || product == null || !product.IsActive)
            {
                return false;
            }

            decimal price = product.SellingPrice ?? product.MRP;
            return price > 0;
        }
    }
}
