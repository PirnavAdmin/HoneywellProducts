using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Honeywell.Data;
using Honeywell.Models;
using Honeywell.DTOs;

namespace Honeywell.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PurchaseIndentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PurchaseIndentController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/PurchaseIndent
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PurchaseIndentDto>>> GetAll()
        {
            var indents = await _context.PurchaseIndents
                .Include(pi => pi.Items)
                .OrderByDescending(pi => pi.CreatedAt)
                .ToListAsync();

            var result = indents.Select(MapToDto).ToList();
            return Ok(result);
        }

        // GET: api/PurchaseIndent/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<PurchaseIndentDto>> GetById(int id)
        {
            var indent = await _context.PurchaseIndents
                .Include(pi => pi.Items)
                .FirstOrDefaultAsync(pi => pi.Id == id);

            if (indent == null)
            {
                return NotFound(new { Success = false, Message = "Purchase Indent not found." });
            }

            return Ok(MapToDto(indent));
        }

        // POST: api/PurchaseIndent
        [HttpPost]
        public async Task<ActionResult<PurchaseIndentDto>> Create([FromBody] CreatePurchaseIndentRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.RequestedBy))
            {
                return BadRequest(new { Success = false, Message = "RequestedBy is required." });
            }

            var indent = new PurchaseIndent
            {
                Date = DateTime.UtcNow,
                RequestedBy = request.RequestedBy,
                Warehouse = request.Warehouse,
                Priority = string.IsNullOrWhiteSpace(request.Priority) ? "High" : request.Priority,
                Status = "Pending Approval",
                Remarks = request.Remarks,
                CreatedAt = DateTime.UtcNow,
                Items = new List<PurchaseIndentItem>()
            };

            decimal totalCost = 0;
            if (request.Items != null && request.Items.Count > 0)
            {
                foreach (var item in request.Items)
                {
                    var itemTotal = item.Quantity * item.EstimatedCost;
                    totalCost += itemTotal;

                    indent.Items.Add(new PurchaseIndentItem
                    {
                        ProductId = item.ProductId ?? string.Empty,
                        ProductName = item.ProductName ?? string.Empty,
                        SKU = item.Sku ?? string.Empty,
                        Quantity = item.Quantity,
                        EstimatedCost = item.EstimatedCost
                    });
                }
            }

            indent.TotalEstimatedCost = totalCost;

            _context.PurchaseIndents.Add(indent);
            await _context.SaveChangesAsync();

            // Set IndentNumber e.g. IND-1001
            indent.IndentNumber = $"IND-{indent.Id}";
            await _context.SaveChangesAsync();

            // Notify Admin
            var notification = new Notification
            {
                Title = "New Purchase Indent Created",
                Message = $"Indent '{indent.IndentNumber}' created by {indent.RequestedBy}.",
                Type = "PurchaseIndent",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = indent.Id }, MapToDto(indent));
        }

        // PUT: api/PurchaseIndent/{id}/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdatePurchaseIndentStatusRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Status))
            {
                return BadRequest(new { Success = false, Message = "Status is required." });
            }

            var validStatuses = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "Pending Approval", "Approved", "PO Created", "Rejected"
            };

            if (!validStatuses.Contains(request.Status))
            {
                return BadRequest(new { Success = false, Message = $"Invalid status. Allowed values: {string.Join(", ", validStatuses)}" });
            }

            var indent = await _context.PurchaseIndents
                .Include(pi => pi.Items)
                .FirstOrDefaultAsync(pi => pi.Id == id);

            if (indent == null)
            {
                return NotFound(new { Success = false, Message = "Purchase Indent not found." });
            }

            indent.Status = request.Status;

            var notification = new Notification
            {
                Title = "Purchase Indent Status Updated",
                Message = $"Indent '{indent.IndentNumber}' status updated to {indent.Status}.",
                Type = "PurchaseIndent",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Success = true,
                Message = $"Purchase Indent status updated to {indent.Status}.",
                Data = MapToDto(indent)
            });
        }

        private static PurchaseIndentDto MapToDto(PurchaseIndent indent)
        {
            return new PurchaseIndentDto
            {
                Id = indent.Id,
                IndentNumber = string.IsNullOrEmpty(indent.IndentNumber) ? $"IND-{indent.Id}" : indent.IndentNumber,
                Date = indent.Date.ToString("yyyy-MM-dd"),
                RequestedBy = indent.RequestedBy,
                Warehouse = indent.Warehouse,
                Priority = indent.Priority,
                Status = indent.Status,
                Remarks = indent.Remarks,
                TotalEstimatedCost = indent.TotalEstimatedCost,
                CreatedAt = indent.CreatedAt.ToString("o"),
                Items = indent.Items.Select(i => new PurchaseIndentItemDto
                {
                    ProductId = i.ProductId,
                    ProductName = i.ProductName,
                    Sku = i.SKU,
                    Quantity = i.Quantity,
                    EstimatedCost = i.EstimatedCost
                }).ToList()
            };
        }
    }
}
