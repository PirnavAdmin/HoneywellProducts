using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Honeywell.Data;
using Honeywell.DTOs.Catalog;
using Honeywell.Models;
using Honeywell.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Honeywell.Services
{
    public class ProductSoftwareService : IProductSoftwareService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        private readonly string _uploadFolderPath;
        private readonly long _maxFileSizeBytes;
        private readonly string[] _allowedExtensions;

        public ProductSoftwareService(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;

            // Load configurations from appsettings with safe defaults
            var pathRelative = _configuration["SoftwareUpload:Path"] ?? "wwwroot/uploads/software";
            _uploadFolderPath = Path.Combine(Directory.GetCurrentDirectory(), pathRelative.Replace('/', Path.DirectorySeparatorChar));

            var maxSizeMb = 500;
            if (int.TryParse(_configuration["SoftwareUpload:MaxSizeMb"], out var configuredSize))
            {
                maxSizeMb = configuredSize;
            }
            _maxFileSizeBytes = (long)maxSizeMb * 1024 * 1024;

            var configuredExts = _configuration.GetSection("SoftwareUpload:AllowedExtensions").Get<string[]>();
            _allowedExtensions = configuredExts != null && configuredExts.Length > 0
                ? configuredExts.Select(e => e.ToLower()).ToArray()
                : new[] { ".exe", ".msi", ".zip", ".dmg", ".pkg", ".deb", ".rpm", ".apk", ".bin", ".img" };
        }

        public async Task<List<ProductSoftwareDto>> GetAllAsync(
            string? search,
            int? productId,
            int? categoryId,
            string? softwareType,
            string? platform,
            bool? featured,
            string? status,
            bool isAdmin,
            int page = 1,
            int pageSize = 50)
        {
            var query = _context.ProductSoftware
                .Include(s => s.Product)
                .AsNoTracking()
                .AsQueryable();

            // Public filter rule: non-admin gets ONLY Active
            if (!isAdmin)
            {
                query = query.Where(s => s.Status == "Active");
            }
            else if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(s => s.Status.ToLower() == status.ToLower());
            }

            // Category filter
            if (categoryId.HasValue && categoryId.Value > 0)
            {
                query = query.Where(s => s.Product != null && s.Product.CategoryId == categoryId.Value);
            }

            // Product filter
            if (productId.HasValue && productId.Value > 0)
            {
                query = query.Where(s => s.ProductId == productId.Value);
            }

            // SoftwareType filter
            if (!string.IsNullOrWhiteSpace(softwareType))
            {
                query = query.Where(s => s.SoftwareType.ToLower() == softwareType.ToLower());
            }

            // Platform filter
            if (!string.IsNullOrWhiteSpace(platform))
            {
                query = query.Where(s => s.Platform.ToLower() == platform.ToLower());
            }

            // Featured filter
            if (featured.HasValue)
            {
                query = query.Where(s => s.IsFeatured == featured.Value);
            }

            // Search filter
            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(s =>
                    s.SoftwareName.ToLower().Contains(term) ||
                    s.Version.ToLower().Contains(term) ||
                    s.SoftwareType.ToLower().Contains(term) ||
                    s.Platform.ToLower().Contains(term) ||
                    (s.Product != null && s.Product.ProductName.ToLower().Contains(term)) ||
                    (s.Product != null && s.Product.SKU.ToLower().Contains(term))
                );
            }

            // Pagination & Sorting
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var items = await query
                .OrderBy(s => s.SortOrder)
                .ThenByDescending(s => s.ReleaseDate)
                .ThenByDescending(s => s.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return items.Select(MapToDto).ToList();
        }

        public async Task<ProductSoftwareDto?> GetByIdAsync(int id, bool isAdmin)
        {
            var item = await _context.ProductSoftware
                .Include(s => s.Product)
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == id);

            if (item == null) return null;
            if (!isAdmin && item.Status != "Active") return null;

            return MapToDto(item);
        }

        public async Task<List<ProductSoftwareDto>> GetByProductIdAsync(int productId, bool isAdmin)
        {
            var query = _context.ProductSoftware
                .Include(s => s.Product)
                .AsNoTracking()
                .Where(s => s.ProductId == productId);

            if (!isAdmin)
            {
                query = query.Where(s => s.Status == "Active");
            }

            var items = await query
                .OrderBy(s => s.SortOrder)
                .ThenByDescending(s => s.ReleaseDate)
                .ToListAsync();

            return items.Select(MapToDto).ToList();
        }

        public async Task<ProductSoftwareDto> CreateAsync(CreateProductSoftwareDto dto, IFormFile? file, string? userEmail)
        {
            // 1. Validate product exists
            var productExists = await _context.Products.AnyAsync(p => p.Id == dto.ProductId);
            if (!productExists)
            {
                throw new ArgumentException($"Product with ID {dto.ProductId} does not exist.");
            }

            // 2. Validate external URL scheme if present
            if (!string.IsNullOrWhiteSpace(dto.ExternalUrl))
            {
                ValidateExternalUrl(dto.ExternalUrl);
            }

            // 3. File validation if file is uploaded
            string? storedFileName = null;
            string? originalFileName = null;
            string? fileUrl = null;
            long? fileSize = null;
            string? mimeType = null;

            if (file != null && file.Length > 0)
            {
                (storedFileName, originalFileName, fileSize, mimeType) = await SaveUploadedFileAsync(file);
            }

            // 4. Validate that at least a file or an external URL is present
            if (string.IsNullOrWhiteSpace(storedFileName) && string.IsNullOrWhiteSpace(dto.ExternalUrl))
            {
                throw new ArgumentException("At least one software resource (Uploaded File OR External Download URL) is required.");
            }

            var software = new ProductSoftware
            {
                ProductId = dto.ProductId,
                SoftwareName = dto.SoftwareName.Trim(),
                Description = dto.Description.Trim(),
                SoftwareType = dto.SoftwareType.Trim(),
                Version = dto.Version.Trim(),
                Platform = dto.Platform.Trim(),
                Architecture = dto.Architecture?.Trim(),
                ExternalUrl = dto.ExternalUrl?.Trim(),
                OriginalFileName = originalFileName,
                StoredFileName = storedFileName,
                FileSize = fileSize,
                MimeType = mimeType,
                ReleaseDate = dto.ReleaseDate ?? DateTime.UtcNow,
                ReleaseNotes = dto.ReleaseNotes?.Trim(),
                MinimumRequirements = dto.MinimumRequirements?.Trim(),
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status.Trim(),
                IsFeatured = dto.IsFeatured,
                SortOrder = dto.SortOrder,
                DownloadCount = 0,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = userEmail ?? "SystemAdmin"
            };

            _context.ProductSoftware.Add(software);
            await _context.SaveChangesAsync();

            // Set generated file URL after entity ID is generated
            if (!string.IsNullOrWhiteSpace(software.StoredFileName))
            {
                software.FileUrl = $"/api/software/{software.Id}/download";
                await _context.SaveChangesAsync();
            }

            var createdEntity = await _context.ProductSoftware
                .Include(s => s.Product)
                .AsNoTracking()
                .FirstAsync(s => s.Id == software.Id);

            return MapToDto(createdEntity);
        }

        public async Task<ProductSoftwareDto?> UpdateAsync(int id, UpdateProductSoftwareDto dto, IFormFile? file, string? userEmail)
        {
            var software = await _context.ProductSoftware.FirstOrDefaultAsync(s => s.Id == id);
            if (software == null) return null;

            // Validate product exists
            var productExists = await _context.Products.AnyAsync(p => p.Id == dto.ProductId);
            if (!productExists)
            {
                throw new ArgumentException($"Product with ID {dto.ProductId} does not exist.");
            }

            // Validate external URL
            if (!string.IsNullOrWhiteSpace(dto.ExternalUrl))
            {
                ValidateExternalUrl(dto.ExternalUrl);
            }

            string? oldStoredFileNameToDelete = null;

            if (file != null && file.Length > 0)
            {
                // New file provided -> save new file first
                var (newStoredName, newOrigName, newSize, newMime) = await SaveUploadedFileAsync(file);

                if (!string.IsNullOrWhiteSpace(software.StoredFileName))
                {
                    oldStoredFileNameToDelete = software.StoredFileName;
                }

                software.StoredFileName = newStoredName;
                software.OriginalFileName = newOrigName;
                software.FileSize = newSize;
                software.MimeType = newMime;
                software.FileUrl = $"/api/software/{software.Id}/download";
            }
            else if (!dto.KeepExistingFile && string.IsNullOrWhiteSpace(dto.ExternalUrl))
            {
                throw new ArgumentException("Cannot remove existing file without providing an External Download URL.");
            }

            // Ensure at least file or external URL exists
            if (string.IsNullOrWhiteSpace(software.StoredFileName) && string.IsNullOrWhiteSpace(dto.ExternalUrl))
            {
                throw new ArgumentException("At least one software resource (Uploaded File OR External Download URL) is required.");
            }

            software.ProductId = dto.ProductId;
            software.SoftwareName = dto.SoftwareName.Trim();
            software.Description = dto.Description.Trim();
            software.SoftwareType = dto.SoftwareType.Trim();
            software.Version = dto.Version.Trim();
            software.Platform = dto.Platform.Trim();
            software.Architecture = dto.Architecture?.Trim();
            software.ExternalUrl = dto.ExternalUrl?.Trim();
            if (dto.ReleaseDate.HasValue) software.ReleaseDate = dto.ReleaseDate.Value;
            software.ReleaseNotes = dto.ReleaseNotes?.Trim();
            software.MinimumRequirements = dto.MinimumRequirements?.Trim();
            software.Status = string.IsNullOrWhiteSpace(dto.Status) ? software.Status : dto.Status.Trim();
            software.IsFeatured = dto.IsFeatured;
            software.SortOrder = dto.SortOrder;
            software.UpdatedAt = DateTime.UtcNow;
            software.UpdatedBy = userEmail ?? "SystemAdmin";

            await _context.SaveChangesAsync();

            // Safe file deletion after DB transaction succeeds
            if (!string.IsNullOrWhiteSpace(oldStoredFileNameToDelete))
            {
                DeletePhysicalFile(oldStoredFileNameToDelete);
            }

            var updatedEntity = await _context.ProductSoftware
                .Include(s => s.Product)
                .AsNoTracking()
                .FirstAsync(s => s.Id == software.Id);

            return MapToDto(updatedEntity);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var software = await _context.ProductSoftware.FirstOrDefaultAsync(s => s.Id == id);
            if (software == null) return false;

            var storedFile = software.StoredFileName;

            _context.ProductSoftware.Remove(software);
            await _context.SaveChangesAsync();

            // Delete physical file safely
            if (!string.IsNullOrWhiteSpace(storedFile))
            {
                DeletePhysicalFile(storedFile);
            }

            return true;
        }

        public async Task<bool> UpdateStatusAsync(int id, string status, string? userEmail)
        {
            var software = await _context.ProductSoftware.FirstOrDefaultAsync(s => s.Id == id);
            if (software == null) return false;

            software.Status = status.Trim();
            software.UpdatedAt = DateTime.UtcNow;
            software.UpdatedBy = userEmail ?? "SystemAdmin";

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<(byte[]? FileBytes, string MimeType, string DisplayFileName, string? ExternalUrl)> GetDownloadAsync(int id)
        {
            var software = await _context.ProductSoftware.FirstOrDefaultAsync(s => s.Id == id);
            if (software == null || software.Status != "Active")
            {
                return (null, string.Empty, string.Empty, null);
            }

            // Increment DownloadCount
            software.DownloadCount++;
            await _context.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(software.StoredFileName))
            {
                var filePath = Path.Combine(_uploadFolderPath, software.StoredFileName);
                if (File.Exists(filePath))
                {
                    var bytes = await File.ReadAllBytesAsync(filePath);
                    var contentType = software.MimeType ?? "application/octet-stream";
                    var displayFileName = software.OriginalFileName ?? software.StoredFileName;
                    return (bytes, contentType, displayFileName, null);
                }
            }

            return (null, "text/plain", string.Empty, software.ExternalUrl);
        }

        // ─── Helpers ─────────────────────────────────────────────────────────────

        private static void ValidateExternalUrl(string url)
        {
            var trimmed = url.Trim();
            if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uriResult) ||
                (uriResult.Scheme != Uri.UriSchemeHttp && uriResult.Scheme != Uri.UriSchemeHttps))
            {
                throw new ArgumentException("External URL must be a valid http:// or https:// web address.");
            }
        }

        private async Task<(string StoredFileName, string OriginalFileName, long FileSize, string MimeType)> SaveUploadedFileAsync(IFormFile file)
        {
            if (file.Length > _maxFileSizeBytes)
            {
                throw new ArgumentException($"File size exceeds the maximum allowed limit of {_maxFileSizeBytes / (1024 * 1024)} MB.");
            }

            var extension = Path.GetExtension(file.FileName).ToLower();
            if (!_allowedExtensions.Contains(extension))
            {
                throw new ArgumentException($"File extension '{extension}' is not permitted. Allowed formats: {string.Join(", ", _allowedExtensions)}");
            }

            Directory.CreateDirectory(_uploadFolderPath);

            var sanitizedOriginal = Regex.Replace(file.FileName, @"[^a-zA-Z0-9_\-\.]", "_");
            var uniqueFileName = $"{Guid.NewGuid()}_{sanitizedOriginal}";
            var fullPath = Path.Combine(_uploadFolderPath, uniqueFileName);

            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var mimeType = file.ContentType ?? "application/octet-stream";
            return (uniqueFileName, file.FileName, file.Length, mimeType);
        }

        private void DeletePhysicalFile(string fileName)
        {
            try
            {
                var fullPath = Path.Combine(_uploadFolderPath, fileName);
                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ProductSoftwareService] Warning: Could not delete file '{fileName}': {ex.Message}");
            }
        }

        private static ProductSoftwareDto MapToDto(ProductSoftware entity)
        {
            return new ProductSoftwareDto
            {
                Id = entity.Id,
                ProductId = entity.ProductId,
                ProductName = entity.Product?.ProductName ?? "Unknown Product",
                ProductModel = entity.Product?.SKU ?? string.Empty,
                SoftwareName = entity.SoftwareName,
                Description = entity.Description,
                SoftwareType = entity.SoftwareType,
                Version = entity.Version,
                Platform = entity.Platform,
                Architecture = entity.Architecture,
                FileUrl = !string.IsNullOrWhiteSpace(entity.StoredFileName) ? $"/api/software/{entity.Id}/download" : entity.ExternalUrl,
                ExternalUrl = entity.ExternalUrl,
                OriginalFileName = entity.OriginalFileName,
                FileSize = entity.FileSize,
                MimeType = entity.MimeType,
                ReleaseDate = entity.ReleaseDate,
                ReleaseNotes = entity.ReleaseNotes,
                MinimumRequirements = entity.MinimumRequirements,
                Status = entity.Status,
                IsFeatured = entity.IsFeatured,
                SortOrder = entity.SortOrder,
                DownloadCount = entity.DownloadCount,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };
        }
    }
}
