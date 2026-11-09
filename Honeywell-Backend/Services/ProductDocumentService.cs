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
    public class ProductDocumentService : IProductDocumentService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        private readonly string _uploadFolderPath;
        private readonly long _maxFileSizeBytes;
        private readonly string[] _allowedExtensions;

        public ProductDocumentService(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;

            var pathRelative = _configuration["DocumentUpload:Path"] ?? "wwwroot/uploads/documents";
            _uploadFolderPath = Path.Combine(Directory.GetCurrentDirectory(), pathRelative.Replace('/', Path.DirectorySeparatorChar));

            var maxSizeMb = 50;
            if (int.TryParse(_configuration["DocumentUpload:MaxSizeMb"], out var configuredSize))
            {
                maxSizeMb = configuredSize;
            }
            _maxFileSizeBytes = (long)maxSizeMb * 1024 * 1024;

            var configuredExts = _configuration.GetSection("DocumentUpload:AllowedExtensions").Get<string[]>();
            _allowedExtensions = configuredExts != null && configuredExts.Length > 0
                ? configuredExts.Select(e => e.ToLower()).ToArray()
                : new[] { ".pdf" };
        }

        public async Task<List<ProductDocumentDto>> GetAllAsync(
            string? search,
            int? productId,
            int? categoryId,
            string? category,
            string? status,
            bool isAdmin,
            int page = 1,
            int pageSize = 100)
        {
            var query = _context.ProductDocuments
                .Include(d => d.Product)
                    .ThenInclude(p => p!.Category)
                .AsNoTracking()
                .AsQueryable();

            if (!isAdmin)
            {
                query = query.Where(d => d.Status == "Active" && (d.Product == null || d.Product.IsActive));
            }
            else if (!string.IsNullOrWhiteSpace(status) && status.ToLower() != "all")
            {
                query = query.Where(d => d.Status.ToLower() == status.ToLower());
            }

            if (productId.HasValue && productId.Value > 0)
            {
                query = query.Where(d => d.ProductId == productId.Value);
            }

            if (categoryId.HasValue && categoryId.Value > 0)
            {
                query = query.Where(d => d.Product != null && d.Product.CategoryId == categoryId.Value);
            }

            if (!string.IsNullOrWhiteSpace(category) && category.ToLower() != "all")
            {
                var catLower = category.Trim().ToLower();
                query = query.Where(d => d.Category.ToLower() == catLower);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(d =>
                    d.Title.ToLower().Contains(s) ||
                    (d.Description != null && d.Description.ToLower().Contains(s)) ||
                    (d.Product != null && (d.Product.ProductName.ToLower().Contains(s) || d.Product.SKU.ToLower().Contains(s))));
            }

            var items = await query
                .OrderBy(d => d.SortOrder)
                .ThenByDescending(d => d.CreatedAt)
                .Skip((Math.Max(1, page) - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return items.Select(MapToDto).ToList();
        }

        public async Task<ProductDocumentDto?> GetByIdAsync(int id, bool isAdmin)
        {
            var query = _context.ProductDocuments
                .Include(d => d.Product)
                    .ThenInclude(p => p!.Category)
                .AsNoTracking()
                .AsQueryable();

            if (!isAdmin)
            {
                query = query.Where(d => d.Status == "Active");
            }

            var doc = await query.FirstOrDefaultAsync(d => d.Id == id);
            return doc != null ? MapToDto(doc) : null;
        }

        public async Task<List<ProductDocumentDto>> GetByProductIdAsync(int productId, bool isAdmin)
        {
            var query = _context.ProductDocuments
                .Include(d => d.Product)
                    .ThenInclude(p => p!.Category)
                .Where(d => d.ProductId == productId)
                .AsNoTracking()
                .AsQueryable();

            if (!isAdmin)
            {
                query = query.Where(d => d.Status == "Active");
            }

            var docs = await query
                .OrderBy(d => d.SortOrder)
                .ThenByDescending(d => d.CreatedAt)
                .ToListAsync();

            return docs.Select(MapToDto).ToList();
        }

        public async Task<List<ProductDocumentDto>> GetByProductIdentifierAsync(string identifier, bool isAdmin)
        {
            if (string.IsNullOrWhiteSpace(identifier))
            {
                return new List<ProductDocumentDto>();
            }

            int pid = 0;
            if (int.TryParse(identifier.Trim(), out int parsedId))
            {
                pid = parsedId;
            }
            else
            {
                var clean = identifier.Trim().ToLower();
                var unslug = clean.Replace("-", " ");
                var slug = clean.Replace(" ", "-");
                var prod = await _context.Products.AsNoTracking().FirstOrDefaultAsync(p =>
                    p.SKU.ToLower() == clean ||
                    p.ProductName.ToLower() == clean ||
                    p.ProductName.ToLower() == unslug ||
                    p.ProductName.ToLower().Replace(" ", "-") == slug);
                if (prod != null)
                {
                    pid = prod.Id;
                }
            }

            if (pid <= 0)
            {
                return new List<ProductDocumentDto>();
            }

            return await GetByProductIdAsync(pid, isAdmin);
        }

        public async Task<ProductDocumentDto> CreateAsync(CreateProductDocumentDto dto, IFormFile? file, string? userEmail)
        {
            if (dto.ProductId <= 0)
            {
                throw new ArgumentException("A valid Product ID is required.");
            }

            var productExists = await _context.Products.AnyAsync(p => p.Id == dto.ProductId);
            if (!productExists)
            {
                throw new ArgumentException($"Product with ID {dto.ProductId} does not exist.");
            }

            if (string.IsNullOrWhiteSpace(dto.Title))
            {
                throw new ArgumentException("Document title is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.Category))
            {
                throw new ArgumentException("Document category is required.");
            }

            if (file == null || file.Length == 0)
            {
                throw new ArgumentException("A valid PDF file is required for a new document upload.");
            }

            // Save file to storage
            var (storedFileName, originalFileName, fileSize, mimeType) = await SaveUploadedFileAsync(file);

            var document = new ProductDocument
            {
                ProductId = dto.ProductId,
                Category = NormalizeCategory(dto.Category),
                Title = dto.Title.Trim(),
                Description = dto.Description?.Trim(),
                Revision = dto.Revision?.Trim(),
                Language = string.IsNullOrWhiteSpace(dto.Language) ? "English" : dto.Language.Trim(),
                DocumentDate = dto.DocumentDate ?? DateTime.UtcNow,
                OriginalFileName = originalFileName,
                StoredFileName = storedFileName,
                FileSize = fileSize,
                MimeType = mimeType,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status.Trim(),
                SortOrder = dto.SortOrder,
                DownloadCount = 0,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = userEmail ?? "SystemAdmin"
            };

            try
            {
                _context.ProductDocuments.Add(document);
                await _context.SaveChangesAsync();

                document.FileUrl = $"/api/documents/{document.Id}/download";
                await _context.SaveChangesAsync();
            }
            catch
            {
                // Clean up written physical file to avoid orphaned storage if DB fails
                DeletePhysicalFile(storedFileName);
                throw;
            }

            var createdEntity = await _context.ProductDocuments
                .Include(d => d.Product)
                    .ThenInclude(p => p!.Category)
                .AsNoTracking()
                .FirstAsync(d => d.Id == document.Id);

            return MapToDto(createdEntity);
        }

        public async Task<ProductDocumentDto?> UpdateAsync(int id, UpdateProductDocumentDto dto, IFormFile? file, string? userEmail)
        {
            var document = await _context.ProductDocuments.FirstOrDefaultAsync(d => d.Id == id);
            if (document == null) return null;

            if (dto.ProductId.HasValue && dto.ProductId.Value > 0)
            {
                var productExists = await _context.Products.AnyAsync(p => p.Id == dto.ProductId.Value);
                if (!productExists)
                {
                    throw new ArgumentException($"Product with ID {dto.ProductId} does not exist.");
                }
                document.ProductId = dto.ProductId.Value;
            }

            if (string.IsNullOrWhiteSpace(dto.Title))
            {
                throw new ArgumentException("Document title is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.Category))
            {
                throw new ArgumentException("Document category is required.");
            }

            string? oldFileToDelete = null;

            if (file != null && file.Length > 0)
            {
                var (newStored, newOrig, newSize, newMime) = await SaveUploadedFileAsync(file);

                if (!string.IsNullOrWhiteSpace(document.StoredFileName))
                {
                    oldFileToDelete = document.StoredFileName;
                }

                document.StoredFileName = newStored;
                document.OriginalFileName = newOrig;
                document.FileSize = newSize;
                document.MimeType = newMime;
                document.FileUrl = $"/api/documents/{document.Id}/download";
            }
            else if (!dto.KeepExistingFile && string.IsNullOrWhiteSpace(document.StoredFileName))
            {
                throw new ArgumentException("A PDF file must be provided.");
            }

            document.Category = NormalizeCategory(dto.Category);
            document.Title = dto.Title.Trim();
            document.Description = dto.Description?.Trim();
            document.Revision = dto.Revision?.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Language)) document.Language = dto.Language.Trim();
            if (dto.DocumentDate.HasValue) document.DocumentDate = dto.DocumentDate.Value;
            if (!string.IsNullOrWhiteSpace(dto.Status)) document.Status = dto.Status.Trim();
            if (dto.SortOrder.HasValue) document.SortOrder = dto.SortOrder.Value;

            document.UpdatedAt = DateTime.UtcNow;
            document.UpdatedBy = userEmail ?? "SystemAdmin";

            await _context.SaveChangesAsync();

            // Safe cleanup of replaced file
            if (!string.IsNullOrWhiteSpace(oldFileToDelete))
            {
                DeletePhysicalFile(oldFileToDelete);
            }

            var updatedEntity = await _context.ProductDocuments
                .Include(d => d.Product)
                    .ThenInclude(p => p!.Category)
                .AsNoTracking()
                .FirstAsync(d => d.Id == document.Id);

            return MapToDto(updatedEntity);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var document = await _context.ProductDocuments.FirstOrDefaultAsync(d => d.Id == id);
            if (document == null) return false;

            var storedFile = document.StoredFileName;

            _context.ProductDocuments.Remove(document);
            await _context.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(storedFile))
            {
                DeletePhysicalFile(storedFile);
            }

            return true;
        }

        public async Task<bool> UpdateStatusAsync(int id, string status, string? userEmail)
        {
            var document = await _context.ProductDocuments.FirstOrDefaultAsync(d => d.Id == id);
            if (document == null) return false;

            document.Status = status.Trim();
            document.UpdatedAt = DateTime.UtcNow;
            document.UpdatedBy = userEmail ?? "SystemAdmin";

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<(byte[]? FileBytes, string MimeType, string DisplayFileName)> GetDownloadAsync(int id, bool isAdmin)
        {
            var document = await _context.ProductDocuments.FirstOrDefaultAsync(d => d.Id == id);
            if (document == null || (!isAdmin && document.Status != "Active"))
            {
                return (null, string.Empty, string.Empty);
            }

            document.DownloadCount++;
            await _context.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(document.StoredFileName))
            {
                // Prevent path traversal by stripping directory components
                var safeFileName = Path.GetFileName(document.StoredFileName);
                var filePath = Path.Combine(_uploadFolderPath, safeFileName);

                // Verify file resides inside _uploadFolderPath
                var fullPath = Path.GetFullPath(filePath);
                if (!fullPath.StartsWith(Path.GetFullPath(_uploadFolderPath), StringComparison.OrdinalIgnoreCase))
                {
                    throw new UnauthorizedAccessException("Invalid file path detected.");
                }

                if (File.Exists(filePath))
                {
                    var bytes = await File.ReadAllBytesAsync(filePath);
                    var contentType = document.MimeType ?? "application/pdf";
                    var displayFileName = document.OriginalFileName ?? document.StoredFileName;
                    if (!displayFileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                    {
                        displayFileName += ".pdf";
                    }
                    return (bytes, contentType, displayFileName);
                }
            }

            return (null, "application/pdf", string.Empty);
        }

        // ─── Helpers ─────────────────────────────────────────────────────────────

        private static string NormalizeCategory(string category)
        {
            var cat = category.Trim();
            var lower = cat.ToLower();
            if (lower.Contains("datasheet")) return "Datasheets";
            if (lower.Contains("manual") || lower.Contains("guide")) return "User Manuals";
            if (lower.Contains("brochure") || lower.Contains("catalog")) return "Brochures";
            if (lower.Contains("certif")) return "Certifications";
            if (lower.Contains("tech") || lower.Contains("drawing") || lower.Contains("spec")) return "Technical Documents";
            return cat;
        }

        private async Task<(string StoredFileName, string OriginalFileName, long FileSize, string MimeType)> SaveUploadedFileAsync(IFormFile file)
        {
            if (file.Length > _maxFileSizeBytes)
            {
                throw new ArgumentException($"File size ({file.Length / (1024 * 1024)} MB) exceeds the maximum allowed limit of {_maxFileSizeBytes / (1024 * 1024)} MB.");
            }

            var extension = Path.GetExtension(file.FileName).ToLower();
            if (!_allowedExtensions.Contains(extension))
            {
                throw new ArgumentException($"File extension '{extension}' is not permitted. Only PDF documents (.pdf) are supported.");
            }

            // Validate PDF Magic Bytes (%PDF-)
            using (var stream = file.OpenReadStream())
            {
                var header = new byte[5];
                var bytesRead = await stream.ReadAsync(header, 0, 5);
                if (bytesRead < 4 || header[0] != 0x25 || header[1] != 0x50 || header[2] != 0x44 || header[3] != 0x46) // %PDF
                {
                    throw new ArgumentException("The uploaded file is not a valid PDF document.");
                }
            }

            Directory.CreateDirectory(_uploadFolderPath);

            var sanitizedOriginal = Regex.Replace(Path.GetFileName(file.FileName), @"[^a-zA-Z0-9_\-\.]", "_");
            if (!sanitizedOriginal.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            {
                sanitizedOriginal += ".pdf";
            }

            var uniqueFileName = $"{Guid.NewGuid()}_{sanitizedOriginal}";
            var fullPath = Path.Combine(_uploadFolderPath, uniqueFileName);

            using (var fileStream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            return (uniqueFileName, file.FileName, file.Length, "application/pdf");
        }

        private void DeletePhysicalFile(string fileName)
        {
            try
            {
                var safeFileName = Path.GetFileName(fileName);
                var fullPath = Path.Combine(_uploadFolderPath, safeFileName);
                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ProductDocumentService] Warning: Could not delete file '{fileName}': {ex.Message}");
            }
        }

        private static ProductDocumentDto MapToDto(ProductDocument entity)
        {
            return new ProductDocumentDto
            {
                Id = entity.Id,
                ProductId = entity.ProductId,
                ProductName = entity.Product?.ProductName ?? "Honeywell Product",
                ProductModel = entity.Product?.SKU ?? string.Empty,
                CategoryName = entity.Product?.Category?.Name ?? "General",
                Category = entity.Category,
                Title = entity.Title,
                Description = entity.Description,
                Revision = entity.Revision,
                Language = entity.Language,
                DocumentDate = entity.DocumentDate,
                FileUrl = !string.IsNullOrWhiteSpace(entity.StoredFileName) ? $"/api/documents/{entity.Id}/download" : entity.FileUrl,
                OriginalFileName = entity.OriginalFileName,
                FileSize = entity.FileSize,
                MimeType = entity.MimeType ?? "application/pdf",
                Status = entity.Status,
                SortOrder = entity.SortOrder,
                DownloadCount = entity.DownloadCount,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };
        }
    }
}
