using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Honeywell.DTOs.Catalog;
using Honeywell.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Honeywell.Helpers;

namespace Honeywell.Controllers
{
    [ApiController]
    [Route("api/documents")]
    [Route("api/Catalog/documents")]
    public class ProductDocumentsController : ControllerBase
    {
        private readonly IProductDocumentService _documentService;

        public ProductDocumentsController(IProductDocumentService documentService)
        {
            _documentService = documentService;
        }

        private string GetUserEmail()
        {
            if (User?.Identity?.IsAuthenticated == true && !string.IsNullOrEmpty(User.Identity.Name))
            {
                return User.Identity.Name;
            }

            var keys = new[] { "email", "useremail", "user-email", "x-email", "x-user-email" };
            foreach (var key in keys)
            {
                var headerVal = Request.Headers.FirstOrDefault(h => h.Key.Equals(key, StringComparison.OrdinalIgnoreCase)).Value;
                if (!string.IsNullOrEmpty(headerVal))
                {
                    return headerVal.ToString();
                }
            }
            return "SystemAdmin";
        }

        private bool IsAdminMode()
        {
            if (User?.Identity?.IsAuthenticated == true)
            {
                return true;
            }

            var authHeader = Request.Headers["Authorization"].ToString();
            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            var isAdminHeader = Request.Headers["X-Admin-Access"].ToString();
            if (string.Equals(isAdminHeader, "true", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            var adminQuery = Request.Query["admin"].ToString();
            if (string.Equals(adminQuery, "true", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            return false;
        }

        // GET: api/documents
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? search,
            [FromQuery] int? productId,
            [FromQuery] int? categoryId,
            [FromQuery] string? category,
            [FromQuery] string? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 100)
        {
            try
            {
                var isAdmin = IsAdminMode();
                var list = await _documentService.GetAllAsync(search, productId, categoryId, category, status, isAdmin, page, pageSize);
                return Ok(list);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/documents/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var isAdmin = IsAdminMode();
                var item = await _documentService.GetByIdAsync(id, isAdmin);
                if (item == null)
                {
                    return NotFound(new { message = "Document not found or unpublished." });
                }
                return Ok(item);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/products/{identifier}/documents
        [HttpGet("/api/products/{identifier}/documents")]
        public async Task<IActionResult> GetByProduct(string identifier)
        {
            try
            {
                var isAdmin = IsAdminMode();
                var list = await _documentService.GetByProductIdentifierAsync(identifier, isAdmin);
                return Ok(list);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // POST: api/documents
        [HttpPost]
        [AuthorizeModule(PermissionAction.Add, "catalog", "documents")]
        public async Task<IActionResult> Create([FromForm] CreateProductDocumentDto dto)
        {
            try
            {
                var userEmail = GetUserEmail();
                var file = dto.File ?? Request.Form.Files.GetFile("file") ?? Request.Form.Files.GetFile("File");

                var result = await _documentService.CreateAsync(dto, file, userEmail);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to upload product document.", error = ex.Message });
            }
        }

        // POST: api/products/{productId}/documents
        [HttpPost("/api/products/{productId:int}/documents")]
        [AuthorizeModule(PermissionAction.Add, "catalog", "documents")]
        public async Task<IActionResult> CreateForProduct(int productId, [FromForm] CreateProductDocumentDto dto)
        {
            dto.ProductId = productId;
            return await Create(dto);
        }

        // PUT: api/documents/{id}
        [HttpPut("{id:int}")]
        [AuthorizeModule(PermissionAction.Edit, "catalog", "documents")]
        public async Task<IActionResult> Update(int id, [FromForm] UpdateProductDocumentDto dto)
        {
            try
            {
                var userEmail = GetUserEmail();
                var file = dto.File ?? Request.Form.Files.GetFile("file") ?? Request.Form.Files.GetFile("File");

                var result = await _documentService.UpdateAsync(id, dto, file, userEmail);
                if (result == null)
                {
                    return NotFound(new { message = "Document not found." });
                }
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to update product document.", error = ex.Message });
            }
        }

        // DELETE: api/documents/{id}
        [HttpDelete("{id:int}")]
        [AuthorizeModule(PermissionAction.Delete, "catalog", "documents")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var success = await _documentService.DeleteAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "Document not found." });
                }
                return Ok(new { message = "Document deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to delete document.", error = ex.Message });
            }
        }

        // PATCH: api/documents/{id}/status
        [HttpPatch("{id:int}/status")]
        [AuthorizeModule(PermissionAction.Edit, "catalog", "documents")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] DocumentStatusUpdateRequest request)
        {
            if (!IsAdminMode())
            {
                return Unauthorized(new { message = "Administrator access required to update document status." });
            }

            try
            {
                if (string.IsNullOrWhiteSpace(request?.Status))
                {
                    return BadRequest(new { message = "Status value is required." });
                }

                var userEmail = GetUserEmail();
                var success = await _documentService.UpdateStatusAsync(id, request.Status, userEmail);
                if (!success)
                {
                    return NotFound(new { message = "Document not found." });
                }
                return Ok(new { message = "Document status updated successfully.", status = request.Status });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/documents/{id}/download
        [HttpGet("{id:int}/download")]
        public async Task<IActionResult> Download(int id, [FromQuery] bool inline = false, [FromQuery] string? mode = null)
        {
            try
            {
                var isAdmin = IsAdminMode();
                var (fileBytes, mimeType, displayFileName) = await _documentService.GetDownloadAsync(id, isAdmin);

                if (fileBytes != null && fileBytes.Length > 0)
                {
                    var isInline = inline || string.Equals(mode, "view", StringComparison.OrdinalIgnoreCase);
                    if (isInline)
                    {
                        Response.Headers["Content-Disposition"] = $"inline; filename=\"{displayFileName}\"";
                        return File(fileBytes, "application/pdf");
                    }
                    else
                    {
                        return File(fileBytes, "application/pdf", displayFileName);
                    }
                }

                return NotFound(new { message = "Document file unavailable or unpublished." });
            }
            catch (UnauthorizedAccessException)
            {
                return BadRequest(new { message = "Security error accessing requested file." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/documents/{id}/view
        [HttpGet("{id:int}/view")]
        public async Task<IActionResult> ViewDocument(int id)
        {
            return await Download(id, inline: true, mode: "view");
        }

        public class DocumentStatusUpdateRequest
        {
            public string Status { get; set; } = string.Empty;
        }
    }
}
