using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Honeywell.Data;
using Honeywell.DTOs.Catalog;
using Honeywell.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Honeywell.Controllers
{
    [Route("api/products")]
    [Route("api/Product")]
    [Route("api/Catalog/products")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProductsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private static string GenerateSlug(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return string.Empty;
            return System.Text.RegularExpressions.Regex.Replace(text.ToLower().Trim(), @"[^a-z0-9\s-]", "")
                .Replace(" ", "-")
                .Replace("--", "-");
        }

        private static object MapProductToNormalizedResponse(Product p)
        {
            var mainImage = p.Images?.FirstOrDefault()?.ImageUrl ?? "/uploads/images/placeholder.png";
            var imageList = p.Images != null && p.Images.Count > 0
                ? p.Images.Select(img => img.ImageUrl).ToList()
                : new List<string> { mainImage };

            var featuresList = p.Features != null && p.Features.Count > 0
                ? p.Features.Select(f => f.Feature).ToList()
                : new List<string>();

            var slug = GenerateSlug(p.ProductName);

            var effectiveManufacturer = !string.IsNullOrWhiteSpace(p.Manufacturer) ? p.Manufacturer
                : (!string.IsNullOrWhiteSpace(p.SupplierName) && p.SupplierName != "AquaFlow Pvt Ltd" ? p.SupplierName : p.Brand);

            var effectiveSupplier = !string.IsNullOrWhiteSpace(p.SupplierName) && p.SupplierName != "AquaFlow Pvt Ltd" ? p.SupplierName
                : (!string.IsNullOrWhiteSpace(p.Manufacturer) ? p.Manufacturer : p.Brand);

            var shortDesc = p.ShortDescription ?? string.Empty;
            var details = p.ProductDetails ?? string.Empty;
            var fullDesc = !string.IsNullOrWhiteSpace(details) ? details : shortDesc;

            var specsDict = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase)
            {
                ["weight"] = p.Weight ?? string.Empty,
                ["dimensions"] = p.Dimensions ?? string.Empty,
                ["powerSource"] = p.PowerSource ?? string.Empty,
                ["material"] = p.Material ?? string.Empty,
                ["coverageUsage"] = p.CoverageUsage ?? string.Empty
            };

            if (!string.IsNullOrWhiteSpace(p.Specifications))
            {
                try
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(p.Specifications);
                    if (doc.RootElement.ValueKind == System.Text.Json.JsonValueKind.Object)
                    {
                        foreach (var prop in doc.RootElement.EnumerateObject())
                        {
                            specsDict[prop.Name] = prop.Value.ToString();
                        }
                    }
                }
                catch { }
            }

            var categoryDto = p.Category != null ? new
            {
                id = p.Category.Id,
                name = p.Category.Name,
                slug = p.Category.Slug,
                imageUrl = p.Category.ImageUrl,
                isActive = p.Category.IsActive
            } : null;

            var subcategoryDto = p.Subcategory != null ? new
            {
                id = p.Subcategory.Id,
                categoryId = p.Subcategory.CategoryId,
                name = p.Subcategory.Name,
                slug = p.Subcategory.Slug,
                isActive = p.Subcategory.IsActive
            } : null;

            var reviewsList = p.Reviews ?? new List<ProductReview>();
            var hasReviews = reviewsList.Count > 0;
            var actualTotalReviews = hasReviews ? reviewsList.Count : p.TotalReviews;
            var actualAvgRating = hasReviews ? Math.Round(reviewsList.Average(r => r.Rating), 2) : (p.AverageRating > 0m ? p.AverageRating : 5.0m);

            return new
            {
                id = p.Id,
                productName = p.ProductName,
                name = p.ProductName,
                title = p.ProductName,
                sku = p.SKU,
                brand = p.Brand,
                manufacturer = effectiveManufacturer,
                supplier = effectiveSupplier,
                supplierName = effectiveSupplier,
                categoryId = p.CategoryId,
                categoryName = p.Category?.Name ?? string.Empty,
                category = categoryDto,
                subcategoryId = p.SubcategoryId,
                subcategoryName = p.Subcategory?.Name ?? string.Empty,
                subcategory = subcategoryDto,
                mrp = p.MRP,
                sellingPrice = p.SellingPrice ?? p.MRP,
                price = p.SellingPrice ?? p.MRP,
                originalPrice = p.MRP,
                stockQuantity = p.Stock,
                stock = p.Stock,
                quantity = p.Stock,
                slug = slug,
                shortDescription = shortDesc,
                description = shortDesc,
                productDetails = details,
                details = details,
                longDescription = details,
                overview = shortDesc,
                packageIncludes = p.PackageIncludes ?? string.Empty,
                weight = p.Weight ?? string.Empty,
                dimensions = p.Dimensions ?? string.Empty,
                powerSource = p.PowerSource ?? string.Empty,
                material = p.Material ?? string.Empty,
                coverageUsage = p.CoverageUsage ?? string.Empty,
                imageUrl = mainImage,
                image = mainImage,
                images = imageList,
                keyFeatures = featuresList,
                highlights = featuresList,
                features = featuresList,
                videos = p.Videos != null ? p.Videos.Select(v => new { v.Id, v.VideoUrl }).ToList() : new object(),
                reviews = reviewsList.Select(r => new { r.Id, r.CustomerName, r.Rating, r.ReviewComment, r.ReviewDate, r.VerifiedPurchase, r.Status }).ToList(),
                rating = actualAvgRating,
                averageRating = actualAvgRating,
                totalReviews = actualTotalReviews,
                reviewCount = actualTotalReviews,
                discountType = p.DiscountType ?? "none",
                discountAmount = p.DiscountAmount,
                stockStatus = string.IsNullOrWhiteSpace(p.StockStatus) ? (p.Stock > 0 ? "In Stock" : "Out of Stock") : p.StockStatus,
                codAvailability = p.CODAvailability,
                countryOfOrigin = p.CountryOfOrigin ?? "India",
                estimatedDelivery = p.EstimatedDelivery ?? "3-7 business days",
                deliveryReturn = p.DeliveryReturn ?? "Easy Returns",
                isActive = p.IsActive,
                specifications = specsDict
            };
        }

        // GET: api/products
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int? page = null,
            [FromQuery] int? pageSize = null,
            [FromQuery] int? limit = null,
            [FromQuery] string? search = null,
            [FromQuery] int? categoryId = null,
            [FromQuery] int? subcategoryId = null,
            [FromQuery] bool? includeInactive = false)
        {
            var query = _context.Products
                .AsNoTracking()
                .AsSplitQuery()
                .Include(x => x.Category)
                .Include(x => x.Subcategory)
                .Include(x => x.Images)
                .Include(x => x.Videos)
                .Include(x => x.Features)
                .Include(x => x.Reviews)
                .AsQueryable();

            if (includeInactive != true)
            {
                query = query.Where(x => x.IsActive);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(x => x.ProductName.ToLower().Contains(s) || x.SKU.ToLower().Contains(s));
            }

            if (categoryId.HasValue && categoryId.Value > 0)
            {
                query = query.Where(x => x.CategoryId == categoryId.Value);
            }

            if (subcategoryId.HasValue && subcategoryId.Value > 0)
            {
                query = query.Where(x => x.SubcategoryId == subcategoryId.Value);
            }

            int effectivePageSize = pageSize ?? limit ?? 0;
            if (effectivePageSize > 0)
            {
                int currentPage = page ?? 1;
                if (currentPage < 1) currentPage = 1;

                var totalCount = await query.CountAsync();
                var pagedProducts = await query
                    .OrderByDescending(x => x.Id)
                    .Skip((currentPage - 1) * effectivePageSize)
                    .Take(effectivePageSize)
                    .ToListAsync();

                var pagedResult = pagedProducts.Select(MapProductToNormalizedResponse).ToList();
                return Ok(new
                {
                    total = totalCount,
                    totalCount = totalCount,
                    page = currentPage,
                    pageSize = effectivePageSize,
                    data = pagedResult,
                    products = pagedResult
                });
            }

            var products = await query.OrderByDescending(x => x.Id).ToListAsync();
            var result = products.Select(MapProductToNormalizedResponse).ToList();
            return Ok(result);
        }

        // GET: api/products/{identifier}
        [HttpGet("{identifier}")]
        public async Task<IActionResult> GetByIdentifier(string identifier)
        {
            if (string.IsNullOrWhiteSpace(identifier))
                return BadRequest(new { message = "Product identifier is required." });

            var cleanId = identifier.Trim();
            Product? product = null;

            // 1. Try parsing integer ID
            if (int.TryParse(cleanId, out int id))
            {
                product = await _context.Products
                    .AsNoTracking()
                    .AsSplitQuery()
                    .Include(x => x.Category)
                    .Include(x => x.Subcategory)
                    .Include(x => x.Images)
                    .Include(x => x.Videos)
                    .Include(x => x.Features)
                    .Include(x => x.Reviews)
                    .FirstOrDefaultAsync(x => x.Id == id && x.IsActive);
            }

            // 2. Direct SQL lookup by SKU, exact Name, or formatted Slug
            if (product == null)
            {
                var lowerClean = cleanId.ToLower();
                var slugClean = lowerClean.Replace(" ", "-");
                var unslugClean = lowerClean.Replace("-", " ");

                product = await _context.Products
                    .AsNoTracking()
                    .AsSplitQuery()
                    .Include(x => x.Category)
                    .Include(x => x.Subcategory)
                    .Include(x => x.Images)
                    .Include(x => x.Videos)
                    .Include(x => x.Features)
                    .Include(x => x.Reviews)
                    .FirstOrDefaultAsync(p =>
                        p.IsActive && (
                        p.SKU.ToLower() == lowerClean ||
                        p.ProductName.ToLower() == lowerClean ||
                        p.ProductName.ToLower() == unslugClean ||
                        p.ProductName.ToLower().Replace(" ", "-") == slugClean));
            }

            // 3. Fallback: targeted candidates search (max 10) instead of loading full table
            if (product == null)
            {
                var lowerClean = cleanId.ToLower();
                var searchKeyword = lowerClean.Replace("-", " ").Trim();
                var candidates = await _context.Products
                    .AsNoTracking()
                    .AsSplitQuery()
                    .Include(x => x.Category)
                    .Include(x => x.Subcategory)
                    .Include(x => x.Images)
                    .Include(x => x.Videos)
                    .Include(x => x.Features)
                    .Include(x => x.Reviews)
                    .Where(p => p.IsActive && (EF.Functions.Like(p.ProductName, $"%{searchKeyword}%") || EF.Functions.Like(p.SKU, $"%{cleanId}%")))
                    .Take(10)
                    .ToListAsync();

                product = candidates.FirstOrDefault(p =>
                    p.SKU.Equals(cleanId, StringComparison.OrdinalIgnoreCase) ||
                    GenerateSlug(p.ProductName).Equals(lowerClean, StringComparison.OrdinalIgnoreCase) ||
                    p.ProductName.Equals(cleanId, StringComparison.OrdinalIgnoreCase)
                );
            }

            if (product == null)
            {
                return NotFound(new { message = $"Product with identifier '{identifier}' was not found." });
            }

            return Ok(MapProductToNormalizedResponse(product));
        }

        // Helper: Fill CreateProductDto from FormCollection keys (case-insensitive)
        private static void FillDtoFromForm(CreateProductDto dto, IFormCollection form)
        {
            string GetFormVal(params string[] keys)
            {
                foreach (var k in keys)
                {
                    if (form.TryGetValue(k, out var val) && !string.IsNullOrWhiteSpace(val.ToString()))
                        return val.ToString();
                    foreach (var key in form.Keys)
                    {
                        if (key.Equals(k, StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(form[key].ToString()))
                            return form[key].ToString();
                    }
                }
                return string.Empty;
            }

            var name = GetFormVal("ProductName", "productName", "Name", "name", "title", "Product_Name", "product_name");
            if (!string.IsNullOrWhiteSpace(name)) dto.ProductName = name;

            var sku = GetFormVal("SKU", "sku", "productSku", "ProductSku", "product_sku");
            if (!string.IsNullOrWhiteSpace(sku)) dto.SKU = sku;

            var brand = GetFormVal("Brand", "brand", "brandName");
            if (!string.IsNullOrWhiteSpace(brand)) dto.Brand = brand;

            var mfg = GetFormVal("Manufacturer", "manufacturer", "SupplierName", "supplier", "supplierName", "mfg");
            if (!string.IsNullOrWhiteSpace(mfg)) dto.Manufacturer = mfg;

            var mrpStr = GetFormVal("MRP", "mrp", "originalPrice", "regularPrice", "marketPrice");
            if (decimal.TryParse(mrpStr, out var parsedMrp) && parsedMrp > 0) dto.MRP = parsedMrp;

            var priceStr = GetFormVal("SellingPrice", "sellingPrice", "Price", "price", "productPrice", "offerPrice");
            if (decimal.TryParse(priceStr, out var parsedPrice) && parsedPrice > 0) dto.SellingPrice = parsedPrice;

            var stockStr = GetFormVal("Stock", "stock", "StockQuantity", "quantity", "stockQuantity", "qty");
            if (int.TryParse(stockStr, out var parsedStock)) dto.Stock = parsedStock;

            var catStr = GetFormVal("CategoryId", "categoryId", "category_id", "category", "catId");
            if (int.TryParse(catStr, out var parsedCatId)) dto.CategoryId = parsedCatId;

            var subcatStr = GetFormVal("SubcategoryId", "subcategoryId", "subcategory_id", "subcategory", "subCatId");
            if (int.TryParse(subcatStr, out var parsedSubCatId)) dto.SubcategoryId = parsedSubCatId;

            var desc = GetFormVal("ShortDescription", "shortDescription", "Description", "description", "short_description", "summary");
            if (!string.IsNullOrWhiteSpace(desc)) dto.ShortDescription = desc;

            var details = GetFormVal("ProductDetails", "productDetails", "details", "product_details", "longDescription", "fullDescription", "overview", "long_description", "info");
            if (!string.IsNullOrWhiteSpace(details)) dto.ProductDetails = details;

            var pkg = GetFormVal("PackageIncludes", "packageIncludes", "includes", "package_includes", "inTheBox", "boxContents");
            if (!string.IsNullOrWhiteSpace(pkg)) dto.PackageIncludes = pkg;

            var weight = GetFormVal("Weight", "weight");
            if (!string.IsNullOrWhiteSpace(weight)) dto.Weight = weight;

            var dim = GetFormVal("Dimensions", "dimensions", "size");
            if (!string.IsNullOrWhiteSpace(dim)) dto.Dimensions = dim;

            var power = GetFormVal("PowerSource", "powerSource", "power_source", "power");
            if (!string.IsNullOrWhiteSpace(power)) dto.PowerSource = power;

            var mat = GetFormVal("Material", "material");
            if (!string.IsNullOrWhiteSpace(mat)) dto.Material = mat;

            var cov = GetFormVal("CoverageUsage", "coverageUsage", "coverage_usage", "coverage", "usage");
            if (!string.IsNullOrWhiteSpace(cov)) dto.CoverageUsage = cov;

            var origin = GetFormVal("CountryOfOrigin", "countryOfOrigin", "country_of_origin", "origin");
            if (!string.IsNullOrWhiteSpace(origin)) dto.CountryOfOrigin = origin;

            var del = GetFormVal("EstimatedDelivery", "estimatedDelivery", "estimated_delivery", "delivery");
            if (!string.IsNullOrWhiteSpace(del)) dto.EstimatedDelivery = del;

            var ret = GetFormVal("DeliveryReturn", "deliveryReturn", "delivery_return", "returns");
            if (!string.IsNullOrWhiteSpace(ret)) dto.DeliveryReturn = ret;

            var discType = GetFormVal("DiscountType", "discountType", "discount_type");
            if (!string.IsNullOrWhiteSpace(discType)) dto.DiscountType = discType;

            var discAmtStr = GetFormVal("DiscountAmount", "discountAmount", "discount_amount", "discount");
            if (decimal.TryParse(discAmtStr, out var parsedDiscAmt)) dto.DiscountAmount = parsedDiscAmt;

            var stockStat = GetFormVal("StockStatus", "stockStatus", "stock_status");
            if (!string.IsNullOrWhiteSpace(stockStat)) dto.StockStatus = stockStat;

            var codStr = GetFormVal("CODAvailability", "codAvailability", "cod", "cod_availability");
            if (bool.TryParse(codStr, out var parsedCod)) dto.CODAvailability = parsedCod;

            var activeStr = GetFormVal("IsActive", "isActive", "status", "is_active");
            if (bool.TryParse(activeStr, out var parsedActive)) dto.IsActive = parsedActive;

            var revJson = GetFormVal("ReviewsJson", "reviewsJson", "reviews");
            if (!string.IsNullOrWhiteSpace(revJson)) dto.ReviewsJson = revJson;

            var specsJson = GetFormVal("Specifications", "specifications", "specs", "Specs");
            if (!string.IsNullOrWhiteSpace(specsJson)) dto.Specifications = specsJson;
        }

        // Helper: Parse raw JSON body to populate CreateProductDto fields regardless of property casing or naming variations
        private static void ParseJsonPayloadIntoDto(CreateProductDto dto, string bodyText)
        {
            if (string.IsNullOrWhiteSpace(bodyText)) return;
            try
            {
                using var doc = System.Text.Json.JsonDocument.Parse(bodyText);
                var root = doc.RootElement;
                if (root.ValueKind != System.Text.Json.JsonValueKind.Object) return;

                string GetStrVal(params string[] propNames)
                {
                    foreach (var p in propNames)
                    {
                        foreach (var prop in root.EnumerateObject())
                        {
                            if (prop.Name.Equals(p, StringComparison.OrdinalIgnoreCase))
                            {
                                if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.String)
                                    return prop.Value.GetString() ?? string.Empty;
                                if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.Number)
                                    return prop.Value.GetRawText();
                            }
                        }
                    }
                    return string.Empty;
                }

                decimal GetDecVal(params string[] propNames)
                {
                    foreach (var p in propNames)
                    {
                        foreach (var prop in root.EnumerateObject())
                        {
                            if (prop.Name.Equals(p, StringComparison.OrdinalIgnoreCase))
                            {
                                if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.Number && prop.Value.TryGetDecimal(out var d))
                                    return d;
                                if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.String && decimal.TryParse(prop.Value.GetString(), out var dParsed))
                                    return dParsed;
                            }
                        }
                    }
                    return 0m;
                }

                int GetIntVal(params string[] propNames)
                {
                    foreach (var p in propNames)
                    {
                        foreach (var prop in root.EnumerateObject())
                        {
                            if (prop.Name.Equals(p, StringComparison.OrdinalIgnoreCase))
                            {
                                if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.Number && prop.Value.TryGetInt32(out var i))
                                    return i;
                                if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.String && int.TryParse(prop.Value.GetString(), out var iParsed))
                                    return iParsed;
                            }
                        }
                    }
                    return 0;
                }

                var name = GetStrVal("ProductName", "productName", "Name", "name", "title", "Product_Name");
                if (!string.IsNullOrWhiteSpace(name)) dto.ProductName = name;

                var sku = GetStrVal("SKU", "sku", "productSku", "ProductSku");
                if (!string.IsNullOrWhiteSpace(sku)) dto.SKU = sku;

                var brand = GetStrVal("Brand", "brand", "brandName");
                if (!string.IsNullOrWhiteSpace(brand)) dto.Brand = brand;

                var mfg = GetStrVal("Manufacturer", "manufacturer", "SupplierName", "supplier", "supplierName");
                if (!string.IsNullOrWhiteSpace(mfg)) dto.Manufacturer = mfg;

                var mrp = GetDecVal("MRP", "mrp", "originalPrice", "regularPrice", "marketPrice");
                if (mrp > 0) dto.MRP = mrp;

                var price = GetDecVal("SellingPrice", "sellingPrice", "Price", "price", "productPrice", "offerPrice");
                if (price > 0) dto.SellingPrice = price;

                var stock = GetIntVal("Stock", "stock", "StockQuantity", "quantity", "stockQuantity", "qty");
                if (stock > 0) dto.Stock = stock;

                var catId = GetIntVal("CategoryId", "categoryId", "category_id", "category");
                if (catId > 0) dto.CategoryId = catId;

                var subcatId = GetIntVal("SubcategoryId", "subcategoryId", "subcategory_id", "subcategory");
                if (subcatId > 0) dto.SubcategoryId = subcatId;

                var desc = GetStrVal("ShortDescription", "shortDescription", "Description", "description", "short_description", "summary");
                if (!string.IsNullOrWhiteSpace(desc)) dto.ShortDescription = desc;

                var details = GetStrVal("ProductDetails", "productDetails", "details", "product_details", "longDescription", "fullDescription", "overview", "info");
                if (!string.IsNullOrWhiteSpace(details)) dto.ProductDetails = details;

                var pkg = GetStrVal("PackageIncludes", "packageIncludes", "includes", "package_includes", "inTheBox", "boxContents");
                if (!string.IsNullOrWhiteSpace(pkg)) dto.PackageIncludes = pkg;

                var weight = GetStrVal("Weight", "weight");
                if (!string.IsNullOrWhiteSpace(weight)) dto.Weight = weight;

                var dim = GetStrVal("Dimensions", "dimensions", "size");
                if (!string.IsNullOrWhiteSpace(dim)) dto.Dimensions = dim;

                var power = GetStrVal("PowerSource", "powerSource", "power_source", "power");
                if (!string.IsNullOrWhiteSpace(power)) dto.PowerSource = power;

                var mat = GetStrVal("Material", "material");
                if (!string.IsNullOrWhiteSpace(mat)) dto.Material = mat;

                var cov = GetStrVal("CoverageUsage", "coverageUsage", "coverage_usage", "coverage", "usage");
                if (!string.IsNullOrWhiteSpace(cov)) dto.CoverageUsage = cov;

                var origin = GetStrVal("CountryOfOrigin", "countryOfOrigin", "country_of_origin", "origin");
                if (!string.IsNullOrWhiteSpace(origin)) dto.CountryOfOrigin = origin;

                var del = GetStrVal("EstimatedDelivery", "estimatedDelivery", "estimated_delivery", "delivery");
                if (!string.IsNullOrWhiteSpace(del)) dto.EstimatedDelivery = del;

                var ret = GetStrVal("DeliveryReturn", "deliveryReturn", "delivery_return", "returns");
                if (!string.IsNullOrWhiteSpace(ret)) dto.DeliveryReturn = ret;

                var discType = GetStrVal("DiscountType", "discountType", "discount_type");
                if (!string.IsNullOrWhiteSpace(discType)) dto.DiscountType = discType;

                var discAmt = GetDecVal("DiscountAmount", "discountAmount", "discount_amount", "discount");
                if (discAmt > 0) dto.DiscountAmount = discAmt;

                var stockStat = GetStrVal("StockStatus", "stockStatus", "stock_status");
                if (!string.IsNullOrWhiteSpace(stockStat)) dto.StockStatus = stockStat;

                var specsDirect = GetStrVal("Specifications", "specifications", "specs");
                if (!string.IsNullOrWhiteSpace(specsDirect)) dto.Specifications = specsDirect;

                foreach (var prop in root.EnumerateObject())
                {
                    if (prop.Name.Equals("specifications", StringComparison.OrdinalIgnoreCase) || prop.Name.Equals("specs", StringComparison.OrdinalIgnoreCase))
                    {
                        if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.Object)
                        {
                            dto.Specifications = prop.Value.GetRawText();
                            foreach (var sProp in prop.Value.EnumerateObject())
                            {
                                var sName = sProp.Name.ToLower();
                                var sVal = sProp.Value.ToString();
                                if (sName.Contains("weight") && string.IsNullOrWhiteSpace(dto.Weight)) dto.Weight = sVal;
                                else if (sName.Contains("dimension") && string.IsNullOrWhiteSpace(dto.Dimensions)) dto.Dimensions = sVal;
                                else if (sName.Contains("power") && string.IsNullOrWhiteSpace(dto.PowerSource)) dto.PowerSource = sVal;
                                else if (sName.Contains("material") && string.IsNullOrWhiteSpace(dto.Material)) dto.Material = sVal;
                                else if (sName.Contains("coverage") && string.IsNullOrWhiteSpace(dto.CoverageUsage)) dto.CoverageUsage = sVal;
                            }
                        }
                        else if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.String)
                        {
                            var sVal = prop.Value.GetString();
                            if (!string.IsNullOrWhiteSpace(sVal))
                            {
                                dto.Specifications = sVal;
                            }
                        }
                    }
                    else if (prop.Name.Equals("features", StringComparison.OrdinalIgnoreCase) ||
                             prop.Name.Equals("keyFeatures", StringComparison.OrdinalIgnoreCase) ||
                             prop.Name.Equals("highlights", StringComparison.OrdinalIgnoreCase))
                    {
                        if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.Array)
                        {
                            dto.Features ??= new List<string>();
                            foreach (var elem in prop.Value.EnumerateArray())
                            {
                                var fStr = elem.ToString();
                                if (!string.IsNullOrWhiteSpace(fStr) && !dto.Features.Contains(fStr))
                                    dto.Features.Add(fStr);
                            }
                        }
                        else if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.String)
                        {
                            dto.FeaturesJson = prop.Value.GetString();
                        }
                    }
                }
            }
            catch { }
        }

        // Helper: Process incoming images from uploaded files, form text URLs, base64 strings, or JSON body
        private static async Task<List<ProductImage>> ProcessIncomingImagesAsync(
            List<IFormFile>? dtoImages,
            IFormFileCollection? requestFiles,
            IFormCollection? form,
            string? bodyText)
        {
            var productImages = new List<ProductImage>();
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif", ".jfif", ".svg", ".bmp" };

            var imagesFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "images");
            Directory.CreateDirectory(imagesFolder);

            // 1. Collect all uploaded IFormFiles
            var filesToProcess = new List<IFormFile>();
            if (dtoImages != null && dtoImages.Count > 0)
            {
                filesToProcess.AddRange(dtoImages);
            }
            if (requestFiles != null && requestFiles.Count > 0)
            {
                foreach (var file in requestFiles)
                {
                    if (file.Length > 0 && !filesToProcess.Contains(file))
                    {
                        filesToProcess.Add(file);
                    }
                }
            }

            foreach (var image in filesToProcess)
            {
                var ext = Path.GetExtension(image.FileName).ToLower();
                if (string.IsNullOrEmpty(ext) || !allowedExtensions.Contains(ext))
                {
                    ext = ".png";
                }

                var fileName = Guid.NewGuid().ToString() + ext;
                var filePath = Path.Combine(imagesFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await image.CopyToAsync(stream);
                }

                productImages.Add(new ProductImage { ImageUrl = "/uploads/images/" + fileName });
            }

            // 2. Process text fields / JSON body for image URLs or Base64 data
            var candidateStrings = new List<string>();

            if (form != null)
            {
                var keysToCheck = new[] { "imageUrl", "image", "images", "imageUrls", "ImagesJson", "img", "Image", "Images" };
                foreach (var key in keysToCheck)
                {
                    if (form.TryGetValue(key, out var vals))
                    {
                        foreach (var v in vals)
                        {
                            if (!string.IsNullOrWhiteSpace(v))
                                candidateStrings.Add(v.ToString());
                        }
                    }
                    foreach (var fk in form.Keys)
                    {
                        if (fk.Equals(key, StringComparison.OrdinalIgnoreCase))
                        {
                            var val = form[fk].ToString();
                            if (!string.IsNullOrWhiteSpace(val))
                                candidateStrings.Add(val);
                        }
                    }
                }
            }

            if (!string.IsNullOrWhiteSpace(bodyText))
            {
                try
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(bodyText);
                    var root = doc.RootElement;

                    var propNames = new[] { "imageUrl", "image", "images", "imageUrls", "Images", "Image" };
                    foreach (var prop in propNames)
                    {
                        if (root.TryGetProperty(prop, out var elem) || root.TryGetProperty(prop.ToLower(), out elem))
                        {
                            if (elem.ValueKind == System.Text.Json.JsonValueKind.String)
                            {
                                var s = elem.GetString();
                                if (!string.IsNullOrWhiteSpace(s)) candidateStrings.Add(s);
                            }
                            else if (elem.ValueKind == System.Text.Json.JsonValueKind.Array)
                            {
                                foreach (var item in elem.EnumerateArray())
                                {
                                    if (item.ValueKind == System.Text.Json.JsonValueKind.String)
                                    {
                                        var s = item.GetString();
                                        if (!string.IsNullOrWhiteSpace(s)) candidateStrings.Add(s);
                                    }
                                }
                            }
                        }
                    }
                }
                catch { }
            }

            foreach (var str in candidateStrings)
            {
                var trimmed = str.Trim();
                if (string.IsNullOrWhiteSpace(trimmed)) continue;

                if (trimmed.StartsWith("[") && trimmed.EndsWith("]"))
                {
                    try
                    {
                        var parsedList = System.Text.Json.JsonSerializer.Deserialize<List<string>>(trimmed);
                        if (parsedList != null)
                        {
                            foreach (var s in parsedList)
                            {
                                await ProcessSingleImageString(s, productImages, imagesFolder);
                            }
                            continue;
                        }
                    }
                    catch { }
                }

                await ProcessSingleImageString(trimmed, productImages, imagesFolder);
            }

            return productImages;
        }

        private static async Task ProcessSingleImageString(string str, List<ProductImage> productImages, string imagesFolder)
        {
            if (string.IsNullOrWhiteSpace(str)) return;

            if (str.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase) && str.Contains(";base64,"))
            {
                try
                {
                    var parts = str.Split(";base64,");
                    var mime = parts[0].Replace("data:image/", "").ToLower();
                    var ext = mime.Contains("png") ? ".png" : (mime.Contains("jpeg") || mime.Contains("jpg") ? ".jpg" : (mime.Contains("webp") ? ".webp" : ".png"));
                    var bytes = Convert.FromBase64String(parts[1]);

                    var fileName = Guid.NewGuid().ToString() + ext;
                    var filePath = Path.Combine(imagesFolder, fileName);
                    await System.IO.File.WriteAllBytesAsync(filePath, bytes);

                    productImages.Add(new ProductImage { ImageUrl = "/uploads/images/" + fileName });
                    return;
                }
                catch { }
            }

            if (str.StartsWith("/") || str.StartsWith("http://") || str.StartsWith("https://"))
            {
                if (!productImages.Any(pi => pi.ImageUrl.Equals(str, StringComparison.OrdinalIgnoreCase)))
                {
                    productImages.Add(new ProductImage { ImageUrl = str });
                }
            }
        }

        // POST: api/products
        [HttpPost]
        public async Task<IActionResult> CreateProduct([FromForm] CreateProductDto dto)
        {
            dto ??= new CreateProductDto();
            string? bodyText = null;

            if (Request.HasFormContentType)
            {
                var form = await Request.ReadFormAsync();
                FillDtoFromForm(dto, form);
            }
            else if (Request.ContentType != null && Request.ContentType.Contains("application/json", StringComparison.OrdinalIgnoreCase))
            {
                using var reader = new StreamReader(Request.Body);
                bodyText = await reader.ReadToEndAsync();
                if (!string.IsNullOrWhiteSpace(bodyText))
                {
                    try
                    {
                        var parsedDto = System.Text.Json.JsonSerializer.Deserialize<CreateProductDto>(bodyText, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                        if (parsedDto != null)
                        {
                            if (!string.IsNullOrWhiteSpace(parsedDto.ProductName)) dto.ProductName = parsedDto.ProductName;
                            if (!string.IsNullOrWhiteSpace(parsedDto.SKU)) dto.SKU = parsedDto.SKU;
                            if (!string.IsNullOrWhiteSpace(parsedDto.Brand)) dto.Brand = parsedDto.Brand;
                            if (!string.IsNullOrWhiteSpace(parsedDto.Manufacturer)) dto.Manufacturer = parsedDto.Manufacturer;
                            if (parsedDto.MRP > 0) dto.MRP = parsedDto.MRP;
                            if (parsedDto.SellingPrice > 0) dto.SellingPrice = parsedDto.SellingPrice;
                            if (parsedDto.Stock > 0) dto.Stock = parsedDto.Stock;
                            if (parsedDto.CategoryId > 0) dto.CategoryId = parsedDto.CategoryId;
                            if (parsedDto.SubcategoryId > 0) dto.SubcategoryId = parsedDto.SubcategoryId;
                            if (!string.IsNullOrWhiteSpace(parsedDto.ShortDescription)) dto.ShortDescription = parsedDto.ShortDescription;
                            if (!string.IsNullOrWhiteSpace(parsedDto.ProductDetails)) dto.ProductDetails = parsedDto.ProductDetails;
                            if (!string.IsNullOrWhiteSpace(parsedDto.PackageIncludes)) dto.PackageIncludes = parsedDto.PackageIncludes;
                            if (!string.IsNullOrWhiteSpace(parsedDto.Weight)) dto.Weight = parsedDto.Weight;
                            if (!string.IsNullOrWhiteSpace(parsedDto.Dimensions)) dto.Dimensions = parsedDto.Dimensions;
                            if (!string.IsNullOrWhiteSpace(parsedDto.PowerSource)) dto.PowerSource = parsedDto.PowerSource;
                            if (!string.IsNullOrWhiteSpace(parsedDto.Material)) dto.Material = parsedDto.Material;
                            if (!string.IsNullOrWhiteSpace(parsedDto.CoverageUsage)) dto.CoverageUsage = parsedDto.CoverageUsage;
                            if (!string.IsNullOrWhiteSpace(parsedDto.CountryOfOrigin)) dto.CountryOfOrigin = parsedDto.CountryOfOrigin;
                            if (!string.IsNullOrWhiteSpace(parsedDto.EstimatedDelivery)) dto.EstimatedDelivery = parsedDto.EstimatedDelivery;
                            if (!string.IsNullOrWhiteSpace(parsedDto.DeliveryReturn)) dto.DeliveryReturn = parsedDto.DeliveryReturn;
                            if (!string.IsNullOrWhiteSpace(parsedDto.DiscountType)) dto.DiscountType = parsedDto.DiscountType;
                            if (parsedDto.DiscountAmount > 0) dto.DiscountAmount = parsedDto.DiscountAmount;
                            if (!string.IsNullOrWhiteSpace(parsedDto.StockStatus)) dto.StockStatus = parsedDto.StockStatus;
                            dto.CODAvailability = parsedDto.CODAvailability;
                            dto.IsActive = parsedDto.IsActive;
                            if (!string.IsNullOrWhiteSpace(parsedDto.FeaturesJson)) dto.FeaturesJson = parsedDto.FeaturesJson;
                            if (!string.IsNullOrWhiteSpace(parsedDto.ReviewsJson)) dto.ReviewsJson = parsedDto.ReviewsJson;
                            if (parsedDto.Features != null && parsedDto.Features.Count > 0) dto.Features = parsedDto.Features;
                        }
                    }
                    catch { }

                    ParseJsonPayloadIntoDto(dto, bodyText);
                }
            }

            if (string.IsNullOrWhiteSpace(dto.ProductDetails) && !string.IsNullOrWhiteSpace(dto.ShortDescription))
                dto.ProductDetails = dto.ShortDescription;
            if (string.IsNullOrWhiteSpace(dto.ShortDescription) && !string.IsNullOrWhiteSpace(dto.ProductDetails))
                dto.ShortDescription = dto.ProductDetails;

            if (dto.SellingPrice <= 0 && dto.MRP > 0)
            {
                dto.SellingPrice = dto.MRP;
            }

            // Fallback for CategoryId
            if (dto.CategoryId <= 0)
            {
                var firstCat = await _context.Categories.FirstOrDefaultAsync();
                if (firstCat != null) dto.CategoryId = firstCat.Id;
            }
            else
            {
                bool categoryExists = await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId);
                if (!categoryExists)
                {
                    var firstCat = await _context.Categories.FirstOrDefaultAsync();
                    if (firstCat != null) dto.CategoryId = firstCat.Id;
                }
            }

            // Fallback for SubcategoryId
            if (dto.SubcategoryId <= 0)
            {
                var firstSub = await _context.Subcategories.FirstOrDefaultAsync(s => s.CategoryId == dto.CategoryId) 
                               ?? await _context.Subcategories.FirstOrDefaultAsync();
                if (firstSub != null) dto.SubcategoryId = firstSub.Id;
            }
            else
            {
                bool subcategoryExists = await _context.Subcategories.AnyAsync(s => s.Id == dto.SubcategoryId);
                if (!subcategoryExists)
                {
                    var firstSub = await _context.Subcategories.FirstOrDefaultAsync(s => s.CategoryId == dto.CategoryId) 
                                   ?? await _context.Subcategories.FirstOrDefaultAsync();
                    if (firstSub != null) dto.SubcategoryId = firstSub.Id;
                }
            }

            // Process Images
            var formColl = Request.HasFormContentType ? await Request.ReadFormAsync() : null;
            var requestFiles = Request.HasFormContentType ? Request.Form.Files : null;
            var productImages = await ProcessIncomingImagesAsync(dto.Images, requestFiles, formColl, bodyText);

            if (productImages.Count == 0)
            {
                productImages.Add(new ProductImage { ImageUrl = "/uploads/images/placeholder.png" });
            }

            // Save video (optional)
            string? videoPath = null;
            if (dto.Video != null)
            {
                var videosFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "videos");
                Directory.CreateDirectory(videosFolder);

                var videoFileName = Guid.NewGuid().ToString() + Path.GetExtension(dto.Video.FileName);
                var videoFullPath = Path.Combine(videosFolder, videoFileName);

                using (var stream = new FileStream(videoFullPath, FileMode.Create))
                    await dto.Video.CopyToAsync(stream);

                videoPath = "/uploads/videos/" + videoFileName;
            }

            // Handle Features
            var featuresList = new List<ProductFeature>();
            if (dto.Features != null && dto.Features.Count > 0)
            {
                foreach (var f in dto.Features)
                {
                    if (!string.IsNullOrWhiteSpace(f))
                        featuresList.Add(new ProductFeature { Feature = f });
                }
            }
            else if (!string.IsNullOrEmpty(dto.FeaturesJson))
            {
                try
                {
                    var parsed = System.Text.Json.JsonSerializer.Deserialize<List<string>>(dto.FeaturesJson);
                    if (parsed != null)
                    {
                        foreach (var f in parsed)
                        {
                            if (!string.IsNullOrWhiteSpace(f))
                                featuresList.Add(new ProductFeature { Feature = f });
                        }
                    }
                }
                catch
                {
                    try
                    {
                        var parsedComplex = System.Text.Json.JsonSerializer.Deserialize<List<ProductFeatureDto>>(dto.FeaturesJson);
                        if (parsedComplex != null)
                        {
                            foreach (var f in parsedComplex)
                            {
                                if (!string.IsNullOrWhiteSpace(f.Feature))
                                    featuresList.Add(new ProductFeature { Feature = f.Feature });
                            }
                        }
                    }
                    catch { }
                }
            }

            // Handle Reviews
            var reviewsList = new List<ProductReview>();
            if (!string.IsNullOrEmpty(dto.ReviewsJson))
            {
                try
                {
                    var parsed = System.Text.Json.JsonSerializer.Deserialize<List<ProductReviewDto>>(dto.ReviewsJson);
                    if (parsed != null)
                    {
                        foreach (var r in parsed)
                        {
                            reviewsList.Add(new ProductReview
                            {
                                CustomerName = r.CustomerName,
                                Rating = r.Rating,
                                ReviewComment = r.ReviewComment,
                                VerifiedPurchase = r.VerifiedPurchase,
                                ReviewDate = r.ReviewDate ?? DateTime.Now
                            });
                        }
                    }
                }
                catch { }
            }

            var averageRating = dto.AverageRating;
            var totalReviews = dto.TotalReviews;
            var fiveStar = dto.FiveStar;
            var fourStar = dto.FourStar;
            var threeStar = dto.ThreeStar;
            var twoStar = dto.TwoStar;
            var oneStar = dto.OneStar;

            if (reviewsList.Count > 0)
            {
                totalReviews = reviewsList.Count;
                averageRating = Math.Round((decimal)reviewsList.Average(r => r.Rating), 2);
                fiveStar = reviewsList.Count(r => r.Rating == 5);
                fourStar = reviewsList.Count(r => r.Rating == 4);
                threeStar = reviewsList.Count(r => r.Rating == 3);
                twoStar = reviewsList.Count(r => r.Rating == 2);
                oneStar = reviewsList.Count(r => r.Rating == 1);
            }

            var product = new Product
            {
                ProductName = string.IsNullOrWhiteSpace(dto.ProductName) ? "New Product" : dto.ProductName,
                SKU = dto.SKU,
                Brand = dto.Brand,
                Manufacturer = dto.Manufacturer,
                MRP = dto.MRP,
                Stock = dto.Stock,
                CategoryId = dto.CategoryId,
                SubcategoryId = dto.SubcategoryId,
                Images = productImages,
                ShortDescription = dto.ShortDescription,
                ProductDetails = dto.ProductDetails,
                PackageIncludes = dto.PackageIncludes,
                Weight = dto.Weight,
                Dimensions = dto.Dimensions,
                PowerSource = dto.PowerSource,
                Material = dto.Material,
                CoverageUsage = dto.CoverageUsage,
                Specifications = dto.Specifications,
                DiscountType = dto.DiscountType,
                DiscountAmount = dto.DiscountAmount,
                SellingPrice = dto.SellingPrice,
                StockStatus = dto.StockStatus ?? string.Empty,
                CODAvailability = dto.CODAvailability,
                CountryOfOrigin = dto.CountryOfOrigin,
                EstimatedDelivery = dto.EstimatedDelivery,
                DeliveryReturn = dto.DeliveryReturn,
                AverageRating = averageRating,
                TotalReviews = totalReviews,
                FiveStar = fiveStar,
                FourStar = fourStar,
                ThreeStar = threeStar,
                TwoStar = twoStar,
                OneStar = oneStar,
                IsActive = dto.IsActive,
                Videos = dto.Video != null
                    ? new List<ProductVideo> { new ProductVideo { VideoUrl = videoPath } }
                    : new List<ProductVideo>(),
                Features = featuresList,
                Reviews = reviewsList
            };

            _context.Products.Add(product);

            var category = await _context.Categories.FindAsync(product.CategoryId);
            var subcategory = await _context.Subcategories.FindAsync(product.SubcategoryId);
            var categoryName = category?.Name ?? "Unknown";
            var subcategoryName = subcategory?.Name ?? "Unknown";

            _context.Notifications.Add(new Notification
            {
                Title = "New Product Added",
                Message = $"Product '{product.ProductName}' added in {categoryName} & {subcategoryName}.",
                Type = "NewProduct"
            });

            if (product.Stock <= 10)
            {
                _context.Notifications.Add(new Notification
                {
                    Title = "Low Stock Warning",
                    Message = $"{product.ProductName} is below safety threshold limit ({product.Stock} left).",
                    Type = "LowStock"
                });
            }

            await _context.SaveChangesAsync();

            var createdProduct = await _context.Products
                .Include(x => x.Category)
                .Include(x => x.Subcategory)
                .Include(x => x.Images)
                .Include(x => x.Videos)
                .Include(x => x.Features)
                .Include(x => x.Reviews)
                .FirstOrDefaultAsync(x => x.Id == product.Id);

            return Ok(createdProduct != null ? MapProductToNormalizedResponse(createdProduct) : MapProductToNormalizedResponse(product));
        }

        // PUT: api/products/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduct(int id, [FromForm] CreateProductDto dto)
        {
            var product = await _context.Products
                .Include(x => x.Images)
                .Include(x => x.Videos)
                .Include(x => x.Features)
                .Include(x => x.Reviews)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (product == null)
                return NotFound("Product not found");

            dto ??= new CreateProductDto();
            string? bodyText = null;

            if (Request.HasFormContentType)
            {
                var form = await Request.ReadFormAsync();
                FillDtoFromForm(dto, form);
            }
            else if (Request.ContentType != null && Request.ContentType.Contains("application/json", StringComparison.OrdinalIgnoreCase))
            {
                using var reader = new StreamReader(Request.Body);
                bodyText = await reader.ReadToEndAsync();
                if (!string.IsNullOrWhiteSpace(bodyText))
                {
                    try
                    {
                        var parsedDto = System.Text.Json.JsonSerializer.Deserialize<CreateProductDto>(bodyText, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                        if (parsedDto != null)
                        {
                            if (!string.IsNullOrWhiteSpace(parsedDto.ProductName)) dto.ProductName = parsedDto.ProductName;
                            if (!string.IsNullOrWhiteSpace(parsedDto.SKU)) dto.SKU = parsedDto.SKU;
                            if (!string.IsNullOrWhiteSpace(parsedDto.Brand)) dto.Brand = parsedDto.Brand;
                            if (!string.IsNullOrWhiteSpace(parsedDto.Manufacturer)) dto.Manufacturer = parsedDto.Manufacturer;
                            if (parsedDto.MRP > 0) dto.MRP = parsedDto.MRP;
                            if (parsedDto.SellingPrice > 0) dto.SellingPrice = parsedDto.SellingPrice;
                            if (parsedDto.Stock > 0) dto.Stock = parsedDto.Stock;
                            if (parsedDto.CategoryId > 0) dto.CategoryId = parsedDto.CategoryId;
                            if (parsedDto.SubcategoryId > 0) dto.SubcategoryId = parsedDto.SubcategoryId;
                            if (!string.IsNullOrWhiteSpace(parsedDto.ShortDescription)) dto.ShortDescription = parsedDto.ShortDescription;
                            if (!string.IsNullOrWhiteSpace(parsedDto.ProductDetails)) dto.ProductDetails = parsedDto.ProductDetails;
                            if (!string.IsNullOrWhiteSpace(parsedDto.PackageIncludes)) dto.PackageIncludes = parsedDto.PackageIncludes;
                            if (!string.IsNullOrWhiteSpace(parsedDto.Weight)) dto.Weight = parsedDto.Weight;
                            if (!string.IsNullOrWhiteSpace(parsedDto.Dimensions)) dto.Dimensions = parsedDto.Dimensions;
                            if (!string.IsNullOrWhiteSpace(parsedDto.PowerSource)) dto.PowerSource = parsedDto.PowerSource;
                            if (!string.IsNullOrWhiteSpace(parsedDto.Material)) dto.Material = parsedDto.Material;
                            if (!string.IsNullOrWhiteSpace(parsedDto.CoverageUsage)) dto.CoverageUsage = parsedDto.CoverageUsage;
                            if (!string.IsNullOrWhiteSpace(parsedDto.CountryOfOrigin)) dto.CountryOfOrigin = parsedDto.CountryOfOrigin;
                            if (!string.IsNullOrWhiteSpace(parsedDto.EstimatedDelivery)) dto.EstimatedDelivery = parsedDto.EstimatedDelivery;
                            if (!string.IsNullOrWhiteSpace(parsedDto.DeliveryReturn)) dto.DeliveryReturn = parsedDto.DeliveryReturn;
                            if (!string.IsNullOrWhiteSpace(parsedDto.DiscountType)) dto.DiscountType = parsedDto.DiscountType;
                            if (parsedDto.DiscountAmount > 0) dto.DiscountAmount = parsedDto.DiscountAmount;
                            if (!string.IsNullOrWhiteSpace(parsedDto.StockStatus)) dto.StockStatus = parsedDto.StockStatus;
                            dto.CODAvailability = parsedDto.CODAvailability;
                            dto.IsActive = parsedDto.IsActive;
                            if (!string.IsNullOrWhiteSpace(parsedDto.FeaturesJson)) dto.FeaturesJson = parsedDto.FeaturesJson;
                            if (!string.IsNullOrWhiteSpace(parsedDto.ReviewsJson)) dto.ReviewsJson = parsedDto.ReviewsJson;
                            if (parsedDto.Features != null && parsedDto.Features.Count > 0) dto.Features = parsedDto.Features;
                        }
                    }
                    catch { }

                    ParseJsonPayloadIntoDto(dto, bodyText);
                }
            }

            // Fallback for CategoryId
            if (dto.CategoryId <= 0)
            {
                dto.CategoryId = product.CategoryId;
            }
            else
            {
                bool categoryExists = await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId);
                if (!categoryExists)
                {
                    dto.CategoryId = product.CategoryId;
                }
            }

            // Fallback for SubcategoryId
            if (dto.SubcategoryId <= 0)
            {
                dto.SubcategoryId = product.SubcategoryId;
            }
            else
            {
                bool subcategoryExists = await _context.Subcategories.AnyAsync(s => s.Id == dto.SubcategoryId);
                if (!subcategoryExists)
                {
                    dto.SubcategoryId = product.SubcategoryId;
                }
            }

            // Update basic details if provided
            if (!string.IsNullOrWhiteSpace(dto.ProductName)) product.ProductName = dto.ProductName;
            if (!string.IsNullOrWhiteSpace(dto.SKU)) product.SKU = dto.SKU;
            if (!string.IsNullOrWhiteSpace(dto.Brand)) product.Brand = dto.Brand;
            if (!string.IsNullOrWhiteSpace(dto.Manufacturer)) product.Manufacturer = dto.Manufacturer;
            if (dto.MRP > 0) product.MRP = dto.MRP;
            if (dto.SellingPrice > 0) product.SellingPrice = dto.SellingPrice;
            if (dto.Stock >= 0) product.Stock = dto.Stock;
            product.CategoryId = dto.CategoryId;
            product.SubcategoryId = dto.SubcategoryId;

            if (!string.IsNullOrWhiteSpace(dto.ShortDescription)) product.ShortDescription = dto.ShortDescription;
            if (!string.IsNullOrWhiteSpace(dto.ProductDetails)) product.ProductDetails = dto.ProductDetails;

            if (string.IsNullOrWhiteSpace(product.ProductDetails) && !string.IsNullOrWhiteSpace(product.ShortDescription))
                product.ProductDetails = product.ShortDescription;
            if (string.IsNullOrWhiteSpace(product.ShortDescription) && !string.IsNullOrWhiteSpace(product.ProductDetails))
                product.ShortDescription = product.ProductDetails;

            if (!string.IsNullOrWhiteSpace(dto.PackageIncludes)) product.PackageIncludes = dto.PackageIncludes;
            if (!string.IsNullOrWhiteSpace(dto.Weight)) product.Weight = dto.Weight;
            if (!string.IsNullOrWhiteSpace(dto.Dimensions)) product.Dimensions = dto.Dimensions;
            if (!string.IsNullOrWhiteSpace(dto.PowerSource)) product.PowerSource = dto.PowerSource;
            if (!string.IsNullOrWhiteSpace(dto.Material)) product.Material = dto.Material;
            if (!string.IsNullOrWhiteSpace(dto.CoverageUsage)) product.CoverageUsage = dto.CoverageUsage;
            if (!string.IsNullOrWhiteSpace(dto.Specifications)) product.Specifications = dto.Specifications;
            if (!string.IsNullOrWhiteSpace(dto.DiscountType)) product.DiscountType = dto.DiscountType;
            if (dto.DiscountAmount >= 0) product.DiscountAmount = dto.DiscountAmount;
            if (!string.IsNullOrWhiteSpace(dto.StockStatus)) product.StockStatus = dto.StockStatus;
            product.CODAvailability = dto.CODAvailability;
            if (!string.IsNullOrWhiteSpace(dto.CountryOfOrigin)) product.CountryOfOrigin = dto.CountryOfOrigin;
            if (!string.IsNullOrWhiteSpace(dto.EstimatedDelivery)) product.EstimatedDelivery = dto.EstimatedDelivery;
            if (!string.IsNullOrWhiteSpace(dto.DeliveryReturn)) product.DeliveryReturn = dto.DeliveryReturn;
            product.IsActive = dto.IsActive;

            // Features & Reviews
            var featuresList = new List<ProductFeature>();
            if (dto.Features != null && dto.Features.Count > 0)
            {
                foreach (var f in dto.Features)
                {
                    if (!string.IsNullOrWhiteSpace(f))
                        featuresList.Add(new ProductFeature { Feature = f });
                }
            }
            else if (!string.IsNullOrEmpty(dto.FeaturesJson))
            {
                try
                {
                    var parsed = System.Text.Json.JsonSerializer.Deserialize<List<string>>(dto.FeaturesJson);
                    if (parsed != null)
                    {
                        foreach (var f in parsed)
                        {
                            if (!string.IsNullOrWhiteSpace(f))
                                featuresList.Add(new ProductFeature { Feature = f });
                        }
                    }
                }
                catch { }
            }

            if (featuresList.Count > 0)
            {
                _context.ProductFeatures.RemoveRange(product.Features);
                product.Features = featuresList;
            }

            // Handle video update if a new video is uploaded
            if (dto.Video != null)
            {
                var videosFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "videos");
                foreach (var v in product.Videos)
                {
                    var relativePath = v.VideoUrl.TrimStart('/');
                    var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relativePath.Replace('/', Path.DirectorySeparatorChar));
                    if (System.IO.File.Exists(fullPath))
                    {
                        System.IO.File.Delete(fullPath);
                    }
                }

                product.Videos.Clear();
                Directory.CreateDirectory(videosFolder);

                var videoFileName = Guid.NewGuid().ToString() + Path.GetExtension(dto.Video.FileName);
                var videoFullPath = Path.Combine(videosFolder, videoFileName);

                using (var stream = new FileStream(videoFullPath, FileMode.Create))
                    await dto.Video.CopyToAsync(stream);

                product.Videos.Add(new ProductVideo { VideoUrl = "/uploads/videos/" + videoFileName });
            }

            // Handle images update
            var formCollUpdate = Request.HasFormContentType ? await Request.ReadFormAsync() : null;
            var requestFilesUpdate = Request.HasFormContentType ? Request.Form.Files : null;
            var newImages = await ProcessIncomingImagesAsync(dto.Images, requestFilesUpdate, formCollUpdate, bodyText);

            // Replace images ONLY if new images were actually provided
            if (newImages.Count > 0)
            {
                _context.ProductImages.RemoveRange(product.Images);
                product.Images = newImages;
            }

            await _context.SaveChangesAsync();

            var updatedProduct = await _context.Products
                .Include(x => x.Category)
                .Include(x => x.Subcategory)
                .Include(x => x.Images)
                .Include(x => x.Videos)
                .Include(x => x.Features)
                .Include(x => x.Reviews)
                .FirstOrDefaultAsync(x => x.Id == id);

            return Ok(updatedProduct != null ? MapProductToNormalizedResponse(updatedProduct) : MapProductToNormalizedResponse(product));
        }

        private async Task<IActionResult> ExecuteProductDelete(int productId)
        {
            try
            {
                if (productId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid Product ID." });
                }

                var product = await _context.Products
                    .Include(x => x.Images)
                    .Include(x => x.Videos)
                    .Include(x => x.Features)
                    .Include(x => x.Reviews)
                    .Include(x => x.SoftwareList)
                    .FirstOrDefaultAsync(x => x.Id == productId);

                if (product == null)
                {
                    return NotFound(new { success = false, message = $"Product with ID {productId} not found." });
                }

                // 1. Delete associated physical files from disk safely
                if (product.Images != null && product.Images.Count > 0)
                {
                    foreach (var img in product.Images)
                    {
                        if (!string.IsNullOrWhiteSpace(img.ImageUrl) && !img.ImageUrl.Contains("placeholder") && !img.ImageUrl.Contains("logo"))
                        {
                            try
                            {
                                var relativePath = img.ImageUrl.TrimStart('/');
                                var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relativePath.Replace('/', Path.DirectorySeparatorChar));
                                if (System.IO.File.Exists(fullPath))
                                {
                                    System.IO.File.Delete(fullPath);
                                }
                            }
                            catch { }
                        }
                    }
                }

                if (product.Videos != null && product.Videos.Count > 0)
                {
                    foreach (var v in product.Videos)
                    {
                        if (!string.IsNullOrWhiteSpace(v.VideoUrl))
                        {
                            try
                            {
                                var relativePath = v.VideoUrl.TrimStart('/');
                                var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relativePath.Replace('/', Path.DirectorySeparatorChar));
                                if (System.IO.File.Exists(fullPath))
                                {
                                    System.IO.File.Delete(fullPath);
                                }
                            }
                            catch { }
                        }
                    }
                }

                // 2. Remove related references safely
                try
                {
                    var cartItems = await _context.CartItems.Where(c => c.ProductId == productId).ToListAsync();
                    if (cartItems.Count > 0) _context.CartItems.RemoveRange(cartItems);

                    var wishlistItems = await _context.WishlistItems.Where(w => w.ProductId == productId).ToListAsync();
                    if (wishlistItems.Count > 0) _context.WishlistItems.RemoveRange(wishlistItems);

                    var stockLogs = await _context.StockLedgerLogs.Where(s => s.ProductId == productId).ToListAsync();
                    if (stockLogs.Count > 0) _context.StockLedgerLogs.RemoveRange(stockLogs);

                    var offers = await _context.Offers.Where(o => o.ProductId == productId).ToListAsync();
                    foreach (var off in offers) off.ProductId = null;

                    await _context.SaveChangesAsync();
                }
                catch { }

                // 3. Mark inactive (soft delete) first so it is immediately removed from all active product listings
                product.IsActive = false;
                await _context.SaveChangesAsync();

                // 4. Attempt hard deletion if foreign key constraints allow
                try
                {
                    if (product.Features != null && product.Features.Count > 0) _context.ProductFeatures.RemoveRange(product.Features);
                    if (product.Reviews != null && product.Reviews.Count > 0) _context.ProductReviews.RemoveRange(product.Reviews);
                    if (product.Images != null && product.Images.Count > 0) _context.ProductImages.RemoveRange(product.Images);
                    if (product.Videos != null && product.Videos.Count > 0) _context.ProductVideos.RemoveRange(product.Videos);
                    if (product.SoftwareList != null && product.SoftwareList.Count > 0) _context.ProductSoftware.RemoveRange(product.SoftwareList);

                    _context.Products.Remove(product);
                    await _context.SaveChangesAsync();
                }
                catch
                {
                    // If hard delete is restricted (e.g. by order history), soft-delete is already committed and active
                }

                return Ok(new
                {
                    success = true,
                    message = "Product deleted successfully.",
                    id = productId,
                    productName = product.ProductName
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Failed to delete product.", error = ex.Message });
            }
        }

        // DELETE: api/products/{id} OR api/products/delete/{id}
        [HttpDelete("{id:int}")]
        [HttpDelete("delete/{id:int}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            return await ExecuteProductDelete(id);
        }

        // DELETE: api/products?id=123
        [HttpDelete]
        public async Task<IActionResult> DeleteProductQuery([FromQuery] int? id)
        {
            if (!id.HasValue || id.Value <= 0)
            {
                return BadRequest(new { success = false, message = "Product ID query parameter is required." });
            }
            return await ExecuteProductDelete(id.Value);
        }

        // POST: api/products/delete/{id}
        [HttpPost("delete/{id:int}")]
        public async Task<IActionResult> PostDeleteProduct(int id)
        {
            return await ExecuteProductDelete(id);
        }

        // POST: api/products/delete?id=123
        [HttpPost("delete")]
        public async Task<IActionResult> PostDeleteProductBody([FromQuery] int? id)
        {
            int targetId = id ?? 0;
            if (targetId <= 0 && Request.HasFormContentType)
            {
                var form = await Request.ReadFormAsync();
                if (form.TryGetValue("id", out var val) && int.TryParse(val.ToString(), out var parsed))
                {
                    targetId = parsed;
                }
            }
            if (targetId <= 0)
            {
                return BadRequest(new { success = false, message = "Product ID is required for deletion." });
            }
            return await ExecuteProductDelete(targetId);
        }

        // GET: api/products/search?keyword=xyz
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                return Ok(new List<object>());

            var kw = keyword.Trim().ToLower();
            var products = await _context.Products
                .AsNoTracking()
                .Include(x => x.Category)
                .Include(x => x.Subcategory)
                .Include(x => x.Images)
                .Include(x => x.Videos)
                .Include(x => x.Features)
                .Include(x => x.Reviews)
                .Where(x => x.IsActive && (x.ProductName.ToLower().Contains(kw) || x.SKU.ToLower().Contains(kw) || x.Brand.ToLower().Contains(kw)))
                .ToListAsync();

            var result = products.Select(MapProductToNormalizedResponse).ToList();
            return Ok(result);
        }

        // GET: api/products/paged?page=1&pageSize=12&categoryId=1&sort=price-asc
        [HttpGet("paged")]
        public async Task<IActionResult> GetPaged(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 12,
            [FromQuery] int? categoryId = null,
            [FromQuery] int? subcategoryId = null,
            [FromQuery] string? sort = null)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 50);

            var query = _context.Products
                .AsNoTracking()
                .Where(p => p.IsActive);

            if (categoryId.HasValue && categoryId.Value > 0)
            {
                query = query.Where(p => p.CategoryId == categoryId.Value);
            }

            if (subcategoryId.HasValue && subcategoryId.Value > 0)
            {
                query = query.Where(p => p.SubcategoryId == subcategoryId.Value);
            }

            query = sort?.ToLower() switch
            {
                "price-asc" => query.OrderBy(p => p.SellingPrice),
                "price-desc" => query.OrderByDescending(p => p.SellingPrice),
                "newest" => query.OrderByDescending(p => p.Id),
                _ => query.OrderByDescending(p => p.Id)
            };

            var totalItems = await query.CountAsync();
            var rawItems = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(p => p.Category)
                .Include(p => p.Subcategory)
                .Include(p => p.Images)
                .Include(p => p.Videos)
                .Include(p => p.Features)
                .Include(p => p.Reviews)
                .ToListAsync();

            var items = rawItems.Select(MapProductToNormalizedResponse).ToList();

            return Ok(new
            {
                data = items,
                items = items,
                products = items,
                page = page,
                pageSize = pageSize,
                total = totalItems,
                totalItems = totalItems,
                totalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
            });
        }

        // PATCH: api/products/{id}/stock?stock=50
        [HttpPatch("{id}/stock")]
        public async Task<IActionResult> UpdateStock(int id, [FromQuery] int stock)
        {
            var product = await _context.Products.FirstOrDefaultAsync(x => x.Id == id);

            if (product == null)
                return NotFound();

            product.Stock = stock;
            await _context.SaveChangesAsync();

            return Ok("Stock updated");
        }

        // GET: api/products/category/{categoryId}
        [HttpGet("category/{categoryId}")]
        public async Task<IActionResult> GetByCategory(int categoryId)
        {
            var products = await _context.Products
                .AsNoTracking()
                .Include(x => x.Category)
                .Include(x => x.Subcategory)
                .Include(x => x.Images)
                .Include(x => x.Videos)
                .Include(x => x.Features)
                .Include(x => x.Reviews)
                .Where(x => x.IsActive && x.CategoryId == categoryId)
                .ToListAsync();

            var result = products.Select(MapProductToNormalizedResponse).ToList();
            return Ok(result);
        }

        // GET: api/products/subcategory/{subcategoryId}
        [HttpGet("subcategory/{subcategoryId}")]
        public async Task<IActionResult> GetBySubcategory(int subcategoryId)
        {
            var products = await _context.Products
                .AsNoTracking()
                .Include(x => x.Category)
                .Include(x => x.Subcategory)
                .Include(x => x.Images)
                .Include(x => x.Videos)
                .Include(x => x.Features)
                .Include(x => x.Reviews)
                .Where(x => x.IsActive && x.SubcategoryId == subcategoryId)
                .ToListAsync();

            var result = products.Select(MapProductToNormalizedResponse).ToList();
            return Ok(result);
        }

        // GET: api/products/dashboard
        [HttpGet("dashboard")]
        public async Task<IActionResult> Dashboard()
        {
            var result = new
            {
                totalProducts = await _context.Products.CountAsync(p => p.IsActive),
                totalCategories = await _context.Categories.CountAsync(),
                totalSubcategories = await _context.Subcategories.CountAsync()
            };

            return Ok(result);
        }

        // GET: api/products/related/{productId}
        [HttpGet("related/{productId}")]
        public async Task<IActionResult> GetRelatedProducts(int productId)
        {
            var product = await _context.Products.AsNoTracking().FirstOrDefaultAsync(x => x.Id == productId && x.IsActive);

            if (product == null)
                return NotFound();

            var relatedProducts = await _context.Products
                .AsNoTracking()
                .Include(x => x.Category)
                .Include(x => x.Subcategory)
                .Include(x => x.Images)
                .Include(x => x.Videos)
                .Include(x => x.Features)
                .Include(x => x.Reviews)
                .Where(x => x.IsActive && x.CategoryId == product.CategoryId && x.Id != productId)
                .Take(4)
                .ToListAsync();

            var result = relatedProducts.Select(MapProductToNormalizedResponse).ToList();
            return Ok(result);
        }
    }

    public class ProductFeatureDto
    {
        public string Feature { get; set; } = string.Empty;
    }

    public class ProductReviewDto
    {
        public string CustomerName { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string ReviewComment { get; set; } = string.Empty;
        public bool VerifiedPurchase { get; set; }
        public DateTime? ReviewDate { get; set; }
    }
}

