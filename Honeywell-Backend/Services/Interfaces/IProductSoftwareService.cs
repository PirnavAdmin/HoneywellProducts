using Honeywell.DTOs.Catalog;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Honeywell.Services.Interfaces
{
    public interface IProductSoftwareService
    {
        Task<List<ProductSoftwareDto>> GetAllAsync(
            string? search,
            int? productId,
            int? categoryId,
            string? softwareType,
            string? platform,
            bool? featured,
            string? status,
            bool isAdmin,
            int page = 1,
            int pageSize = 50);

        Task<ProductSoftwareDto?> GetByIdAsync(int id, bool isAdmin);

        Task<List<ProductSoftwareDto>> GetByProductIdAsync(int productId, bool isAdmin);

        Task<ProductSoftwareDto> CreateAsync(CreateProductSoftwareDto dto, IFormFile? file, string? userEmail);

        Task<ProductSoftwareDto?> UpdateAsync(int id, UpdateProductSoftwareDto dto, IFormFile? file, string? userEmail);

        Task<bool> DeleteAsync(int id);

        Task<bool> UpdateStatusAsync(int id, string status, string? userEmail);

        Task<(byte[]? FileBytes, string MimeType, string DisplayFileName, string? ExternalUrl)> GetDownloadAsync(int id);
    }
}
