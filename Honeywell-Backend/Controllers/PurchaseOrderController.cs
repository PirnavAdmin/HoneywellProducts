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
    public class PurchaseOrderController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PurchaseOrderController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/PurchaseOrder
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PurchaseOrderDto>>> GetAll()
        {
            var orders = await _context.PurchaseOrders
                .Include(po => po.Items)
                .OrderByDescending(po => po.CreatedAt)
                .ToListAsync();

            var result = orders.Select(MapToDto).ToList();
            return Ok(result);
        }

        // GET: api/PurchaseOrder/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<PurchaseOrderDto>> GetById(int id)
        {
            var order = await _context.PurchaseOrders
                .Include(po => po.Items)
                .FirstOrDefaultAsync(po => po.Id == id);

            if (order == null)
            {
                return NotFound(new { Success = false, Message = "Purchase Order not found." });
            }

            return Ok(MapToDto(order));
        }

        // POST: api/PurchaseOrder
        [HttpPost]
        public async Task<ActionResult<PurchaseOrderDto>> Create([FromBody] CreatePurchaseOrderRequest request)
        {
            if (request == null || request.SupplierId <= 0)
            {
                return BadRequest(new { Success = false, Message = "Valid SupplierId is required." });
            }

            // Verify supplier exists if possible, or fetch supplier name
            var supplier = await _context.Suppliers.FindAsync(request.SupplierId);
            string supplierName = supplier != null ? supplier.Name : (request.SupplierName ?? string.Empty);

            var order = new PurchaseOrder
            {
                Date = DateTime.UtcNow,
                IndentId = request.IndentId,
                SupplierId = request.SupplierId,
                SupplierName = supplierName,
                Warehouse = request.Warehouse,
                PaymentTerms = string.IsNullOrWhiteSpace(request.PaymentTerms) ? "Net 30" : request.PaymentTerms,
                ExpectedDeliveryDate = request.ExpectedDeliveryDate ?? DateTime.UtcNow.AddDays(14),
                Status = "Issued",
                Remarks = request.Remarks,
                CreatedAt = DateTime.UtcNow,
                Items = new List<PurchaseOrderItem>()
            };

            decimal totalAmount = 0;
            if (request.Items != null && request.Items.Count > 0)
            {
                foreach (var item in request.Items)
                {
                    var itemTotal = item.Quantity * item.UnitPrice;
                    totalAmount += itemTotal;

                    order.Items.Add(new PurchaseOrderItem
                    {
                        ProductId = item.ProductId ?? string.Empty,
                        ProductName = item.ProductName ?? string.Empty,
                        UnitPrice = item.UnitPrice,
                        Quantity = item.Quantity
                    });
                }
            }

            order.TotalAmount = totalAmount;

            _context.PurchaseOrders.Add(order);
            await _context.SaveChangesAsync();

            // Set PONumber e.g. PO-1001
            order.PONumber = $"PO-{order.Id}";

            // If IndentId was referenced, update associated PurchaseIndent status to "PO Created"
            if (request.IndentId.HasValue && request.IndentId.Value > 0)
            {
                var indent = await _context.PurchaseIndents.FindAsync(request.IndentId.Value);
                if (indent != null)
                {
                    indent.Status = "PO Created";
                }
            }

            await _context.SaveChangesAsync();

            // Notify Admin
            var notification = new Notification
            {
                Title = "New Purchase Order Created",
                Message = $"Purchase Order '{order.PONumber}' created for supplier '{order.SupplierName}'.",
                Type = "PurchaseOrder",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = order.Id }, MapToDto(order));
        }

        // PUT: api/PurchaseOrder/{id}/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdatePurchaseOrderStatusRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Status))
            {
                return BadRequest(new { Success = false, Message = "Status is required." });
            }

            var validStatuses = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "Draft", "Issued", "Partially Received", "Completed", "Cancelled"
            };

            if (!validStatuses.Contains(request.Status))
            {
                return BadRequest(new { Success = false, Message = $"Invalid status. Allowed values: {string.Join(", ", validStatuses)}" });
            }

            var order = await _context.PurchaseOrders
                .Include(po => po.Items)
                .FirstOrDefaultAsync(po => po.Id == id);

            if (order == null)
            {
                return NotFound(new { Success = false, Message = "Purchase Order not found." });
            }

            order.Status = request.Status;

            var notification = new Notification
            {
                Title = "Purchase Order Status Updated",
                Message = $"Purchase Order '{order.PONumber}' status updated to {order.Status}.",
                Type = "PurchaseOrder",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Success = true,
                Message = $"Purchase Order status updated to {order.Status}.",
                Data = MapToDto(order)
            });
        }

        private static PurchaseOrderDto MapToDto(PurchaseOrder order)
        {
            return new PurchaseOrderDto
            {
                Id = order.Id,
                PoNumber = string.IsNullOrEmpty(order.PONumber) ? $"PO-{order.Id}" : order.PONumber,
                Date = order.Date.ToString("yyyy-MM-dd"),
                IndentId = order.IndentId,
                SupplierId = order.SupplierId,
                SupplierName = order.SupplierName,
                Warehouse = order.Warehouse,
                PaymentTerms = order.PaymentTerms,
                ExpectedDeliveryDate = order.ExpectedDeliveryDate.ToString("yyyy-MM-dd"),
                Status = order.Status,
                Remarks = order.Remarks,
                TotalAmount = order.TotalAmount,
                CreatedAt = order.CreatedAt.ToString("o"),
                Items = order.Items.Select(i => new PurchaseOrderItemDto
                {
                    ProductId = i.ProductId,
                    ProductName = i.ProductName,
                    UnitPrice = i.UnitPrice,
                    Quantity = i.Quantity
                }).ToList()
            };
        }
    }
}
