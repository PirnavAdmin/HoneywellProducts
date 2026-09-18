using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Honeywell.DTOs.Catalog;
using Honeywell.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Honeywell.Controllers
{
    [ApiController]
    [Route("api/software")]
    [Route("api/Catalog/software")]
    public class SoftwareController : ControllerBase
    {
        private readonly IProductSoftwareService _softwareService;

        public SoftwareController(IProductSoftwareService softwareService)
        {
            _softwareService = softwareService;
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

        // GET: api/software
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? search,
            [FromQuery] int? productId,
            [FromQuery] int? categoryId,
            [FromQuery] string? softwareType,
            [FromQuery] string? platform,
            [FromQuery] bool? featured,
            [FromQuery] string? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            try
            {
                var isAdmin = IsAdminMode();
                var list = await _softwareService.GetAllAsync(search, productId, categoryId, softwareType, platform, featured, status, isAdmin, page, pageSize);
                return Ok(list);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/software/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var isAdmin = IsAdminMode();
                var item = await _softwareService.GetByIdAsync(id, isAdmin);
                if (item == null)
                {
                    return NotFound(new { message = "Software resource not found or inactive." });
                }
                return Ok(item);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/products/{productId}/software
        [HttpGet("/api/products/{productId:int}/software")]
        public async Task<IActionResult> GetByProduct(int productId)
        {
            try
            {
                var isAdmin = IsAdminMode();
                var list = await _softwareService.GetByProductIdAsync(productId, isAdmin);
                return Ok(list);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // POST: api/software
        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreateProductSoftwareDto dto)
        {
            try
            {
                var userEmail = GetUserEmail();
                var file = dto.File ?? Request.Form.Files.GetFile("file") ?? Request.Form.Files.GetFile("File");

                var result = await _softwareService.CreateAsync(dto, file, userEmail);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to create software entry.", error = ex.Message });
            }
        }

        // PUT: api/software/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromForm] UpdateProductSoftwareDto dto)
        {
            try
            {
                var userEmail = GetUserEmail();
                var file = dto.File ?? Request.Form.Files.GetFile("file") ?? Request.Form.Files.GetFile("File");

                var result = await _softwareService.UpdateAsync(id, dto, file, userEmail);
                if (result == null)
                {
                    return NotFound(new { message = "Software resource not found." });
                }
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to update software entry.", error = ex.Message });
            }
        }

        // DELETE: api/software/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var success = await _softwareService.DeleteAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "Software resource not found." });
                }
                return Ok(new { message = "Software resource deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to delete software entry.", error = ex.Message });
            }
        }

        // PATCH: api/software/{id}/status
        [HttpPatch("{id:int}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] SoftwareStatusUpdateRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request?.Status))
                {
                    return BadRequest(new { message = "Status value is required." });
                }

                var userEmail = GetUserEmail();
                var success = await _softwareService.UpdateStatusAsync(id, request.Status, userEmail);
                if (!success)
                {
                    return NotFound(new { message = "Software resource not found." });
                }
                return Ok(new { message = "Status updated successfully.", status = request.Status });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/software/{id}/download
        [HttpGet("{id:int}/download")]
        public async Task<IActionResult> Download(int id)
        {
            try
            {
                var (fileBytes, mimeType, displayFileName, externalUrl) = await _softwareService.GetDownloadAsync(id);

                if (fileBytes != null && fileBytes.Length > 0)
                {
                    return File(fileBytes, mimeType, displayFileName);
                }

                if (!string.IsNullOrWhiteSpace(externalUrl))
                {
                    return Redirect(externalUrl);
                }

                return NotFound(new { message = "Software file or download link unavailable." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        public class SoftwareStatusUpdateRequest
        {
            public string Status { get; set; } = string.Empty;
        }
    }
}
