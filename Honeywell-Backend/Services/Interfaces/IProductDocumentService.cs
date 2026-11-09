using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Honeywell.DTOs.Catalog;
using Microsoft.AspNetCore.Http;

namespace Honeywell.Services.Interfaces
{
    public interface IProductDocumentService
    {
        Task<List<ProductDocumentDto>> GetAllAsync(
            string? search,
            int? productId,
            int? categoryId,
            string? category,
            string? status,
            bool isAdmin,
            int page = 1,
            int pageSize = 100);

        Task<ProductDocumentDto?> GetByIdAsync(int id, bool isAdmin);

        Task<List<ProductDocumentDto>> GetByProductIdAsync(int productId, bool isAdmin);

        Task<List<ProductDocumentDto>> GetByProductIdentifierAsync(string identifier, bool isAdmin);

        Task<ProductDocumentDto> CreateAsync(CreateProductDocumentDto dto, IFormFile? file, string? userEmail);

        Task<ProductDocumentDto?> UpdateAsync(int id, UpdateProductDocumentDto dto, IFormFile? file, string? userEmail);

        Task<bool> DeleteAsync(int id);

        Task<bool> UpdateStatusAsync(int id, string status, string? userEmail);

        Task<(byte[]? FileBytes, string MimeType, string DisplayFileName)> GetDownloadAsync(int id, bool isAdmin);
    }
}
