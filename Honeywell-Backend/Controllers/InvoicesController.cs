using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Honeywell.Data;
using Honeywell.Models;

namespace Honeywell.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InvoicesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public InvoicesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Invoices?search=
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search)
        {
            var query = _context.Orders
                .Include(o => o.Customer)
                .AsQueryable();

            // Calculate metrics across all orders in database
            var allOrders = await _context.Orders.ToListAsync();
            var totalRevenue = allOrders
                .Where(o => o.Status != "Cancelled" && (o.PaymentStatus.Equals("Paid", StringComparison.OrdinalIgnoreCase) || o.PaymentStatus.Equals("Success", StringComparison.OrdinalIgnoreCase) || o.PaymentStatus.Equals("Verified Paid", StringComparison.OrdinalIgnoreCase)))
                .Sum(o => o.FinalAmount);

            var paidCount = allOrders.Count(o => o.PaymentStatus.Equals("Paid", StringComparison.OrdinalIgnoreCase) || o.PaymentStatus.Equals("Success", StringComparison.OrdinalIgnoreCase) || o.PaymentStatus.Equals("Verified Paid", StringComparison.OrdinalIgnoreCase));
            var unpaidCount = allOrders.Count(o => o.Status != "Cancelled" && !o.PaymentStatus.Equals("Paid", StringComparison.OrdinalIgnoreCase) && !o.PaymentStatus.Equals("Success", StringComparison.OrdinalIgnoreCase) && !o.PaymentStatus.Equals("Verified Paid", StringComparison.OrdinalIgnoreCase));
            var cancelledCount = allOrders.Count(o => o.Status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase));

            // Apply search keywords (Invoice ID, Client Name, Email)
            if (!string.IsNullOrEmpty(search))
            {
                var s = search.ToLower();
                query = query.Where(o => 
                    o.OrderNumber.ToLower().Contains(s) || 
                    (o.Customer != null && o.Customer.Name.ToLower().Contains(s)) ||
                    (o.Customer != null && o.Customer.Email.ToLower().Contains(s))
                );
            }

            var ordersList = await query
                .OrderByDescending(o => o.Id)
                .ToListAsync();

            // Format entries into Invoice models
            var formattedInvoices = ordersList.Select(o => {
                var cleanOrderNum = o.OrderNumber.Replace("#", "").Trim();
                var invoiceId = cleanOrderNum.StartsWith("ORD-") 
                    ? cleanOrderNum.Replace("ORD-", "INV-") 
                    : $"INV-{cleanOrderNum}";

                var displayStatus = "Unpaid";
                if (o.Status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
                {
                    displayStatus = "Cancelled";
                }
                else if (o.PaymentStatus.Equals("Paid", StringComparison.OrdinalIgnoreCase) || o.PaymentStatus.Equals("Success", StringComparison.OrdinalIgnoreCase) || o.PaymentStatus.Equals("Verified Paid", StringComparison.OrdinalIgnoreCase))
                {
                    displayStatus = "Paid";
                }

                return new
                {
                    o.Id,
                    InvoiceId = invoiceId,
                    Client = o.Customer?.Name ?? "Walk-in Customer",
                    Email = o.Customer?.Email ?? "N/A",
                    Date = o.OrderDate.ToString("yyyy-MM-dd"),
                    Billed = $"Rs. {o.FinalAmount:N0}",
                    Status = displayStatus
                };
            }).ToList();

            return Ok(new
            {
                TotalRevenue = $"Rs. {totalRevenue:N0}",
                PaidInvoices = paidCount,
                UnpaidInvoices = unpaidCount,
                CancelledInvoices = cancelledCount,
                Invoices = formattedInvoices
            });
        }

        // GET: api/Invoices/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var order = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound(new { Message = "Invoice/Order not found." });
            }

            var cleanOrderNum = order.OrderNumber.Replace("#", "").Trim();
            var invoiceId = cleanOrderNum.StartsWith("ORD-") 
                ? cleanOrderNum.Replace("ORD-", "INV-") 
                : $"INV-{cleanOrderNum}";

            var displayStatus = "Unpaid";
            if (order.Status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
            {
                displayStatus = "Cancelled";
            }
            else if (order.PaymentStatus.Equals("Paid", StringComparison.OrdinalIgnoreCase) || order.PaymentStatus.Equals("Success", StringComparison.OrdinalIgnoreCase) || order.PaymentStatus.Equals("Verified Paid", StringComparison.OrdinalIgnoreCase))
            {
                displayStatus = "Paid";
            }

            return Ok(new
            {
                Id = order.Id,
                InvoiceId = invoiceId,
                Client = order.Customer?.Name ?? "Walk-in Customer",
                Email = order.Customer?.Email ?? "N/A",
                Phone = order.Customer?.Phone ?? "",
                Address = order.ShippingAddress ?? order.Customer?.Address ?? "",
                ShippingAddress = order.ShippingAddress ?? order.Customer?.Address ?? "",
                Date = order.OrderDate.ToString("yyyy-MM-dd"),
                Billed = $"Rs. {order.FinalAmount:N0}",
                SubTotal = order.TotalAmount,
                TaxAmount = order.GstAmount,
                DiscountAmount = order.DiscountAmount,
                ShippingFee = order.ShippingFee,
                TotalAmount = order.FinalAmount,
                PaymentMethod = order.PaymentMethod,
                Status = displayStatus,
                Notes = order.PackerName ?? "",
                Items = order.Items.Select(i => new {
                    i.ProductName,
                    i.ProductCode,
                    i.Quantity,
                    PriceNum = i.Price,
                    Price = $"Rs. {i.Price:N0}",
                    Total = $"Rs. {i.Subtotal:N0}"
                })
            });
        }

        // POST: api/Invoices
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Create([FromBody] InvoiceCreateRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.ClientName))
            {
                return BadRequest(new { Message = "Client Name is required." });
            }

            // 1. Lookup or create customer by phone/email
            var clientNameTrimmed = request.ClientName.Trim();
            var contactTrimmed = request.ContactNo?.Trim() ?? string.Empty;
            var emailTrimmed = request.EmailAddress?.Trim() ?? string.Empty;

            Customer? customer = null;
            if (!string.IsNullOrEmpty(contactTrimmed) || !string.IsNullOrEmpty(emailTrimmed))
            {
                customer = await _context.Customers.FirstOrDefaultAsync(c =>
                    (!string.IsNullOrEmpty(contactTrimmed) && c.Phone == contactTrimmed) ||
                    (!string.IsNullOrEmpty(emailTrimmed) && c.Email != null && c.Email.ToLower() == emailTrimmed.ToLower()));
            }

            if (customer == null)
            {
                var nameParts = clientNameTrimmed.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
                var firstName = nameParts.Length > 0 ? nameParts[0] : clientNameTrimmed;
                var lastName = nameParts.Length > 1 ? nameParts[1] : "";

                customer = new Customer
                {
                    Name = clientNameTrimmed,
                    FirstName = firstName,
                    LastName = lastName,
                    Phone = contactTrimmed,
                    Email = emailTrimmed,
                    Address = request.Address ?? request.BillingAddress ?? string.Empty,
                    State = "",
                    District = "",
                    Role = "CUSTOMER ACCOUNT",
                    Gender = "Male",
                    CompanyOrganization = "Individual Account",
                    Status = "Active",
                    JoinDate = DateTime.UtcNow,
                    CoinsBalance = 0
                };
                _context.Customers.Add(customer);
                await _context.SaveChangesAsync();
            }

            // 2. Create Order as backing store for the invoice
            var statusStr = "Pending";
            var payStatusStr = "Pending";
            if (!string.IsNullOrEmpty(request.PaymentStatus))
            {
                if (request.PaymentStatus.Equals("Paid", StringComparison.OrdinalIgnoreCase))
                {
                    statusStr = "Processing";
                    payStatusStr = "Paid";
                }
                else if (request.PaymentStatus.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
                {
                    statusStr = "Cancelled";
                    payStatusStr = "Failed";
                }
            }

            var invoiceNumClean = string.IsNullOrEmpty(request.InvoiceNo) 
                ? $"INV-{new Random().Next(100000, 999999)}"
                : request.InvoiceNo.Replace("#", "").Trim();

            // Map back to ORD number format or keep invoice number directly
            var orderNumber = invoiceNumClean.StartsWith("INV-") 
                ? invoiceNumClean.Replace("INV-", "ORD-") 
                : $"ORD-{invoiceNumClean}";

            DateTime orderDateToUse = DateTime.UtcNow;
            if (request.Date.HasValue)
            {
                orderDateToUse = request.Date.Value.Date == DateTime.UtcNow.Date
                    ? DateTime.UtcNow
                    : request.Date.Value.Date.Add(DateTime.UtcNow.TimeOfDay);
            }

            var defaultProdId = await _context.Products.AsNoTracking().Select(p => p.Id).FirstOrDefaultAsync();
            if (defaultProdId <= 0) defaultProdId = 1;

            var order = new Order
            {
                CustomerId = customer.Id,
                OrderNumber = orderNumber,
                OrderDate = orderDateToUse,
                TotalAmount = request.SubTotal,
                FinalAmount = request.TotalAmount,
                DiscountAmount = request.Discount,
                ShippingFee = request.ShippingCharge,
                GstAmount = request.TaxAmount,
                Status = statusStr,
                PaymentStatus = payStatusStr,
                PaymentMethod = request.PaymentMethod ?? "COD",
                ShippingAddress = request.ShippingAddress ?? request.Address ?? string.Empty,
                TrackingNumber = request.TaxNumber ?? request.TransactionRef ?? string.Empty,
                CarrierName = string.Empty,
                PackerName = request.Notes
            };

            if (request.Items != null && request.Items.Any())
            {
                order.Items = request.Items.Select(i =>
                {
                    var qty = i.Quantity > 0 ? i.Quantity : 1;
                    var price = i.Price >= 0 ? i.Price : 0;
                    return new OrderItem
                    {
                        ProductId = i.ProductId > 0 ? i.ProductId : defaultProdId,
                        ProductName = !string.IsNullOrWhiteSpace(i.ProductName) ? i.ProductName.Trim() : "Manual Invoice Item",
                        ProductCode = !string.IsNullOrWhiteSpace(i.ProductCode) ? i.ProductCode.Trim() : "SERV-001",
                        CategoryName = "Invoice Item",
                        Price = price,
                        Quantity = qty,
                        Subtotal = price * qty,
                        ImageUrl = string.Empty
                    };
                }).ToList();
            }
            else
            {
                // Add placeholder order item to represent invoice charges
                var orderItem = new OrderItem
                {
                    ProductId = defaultProdId,
                    ProductName = "Manual Invoice Charges",
                    ProductCode = "SERV-001",
                    CategoryName = "Services",
                    Price = request.SubTotal,
                    Quantity = 1,
                    Subtotal = request.SubTotal,
                    ImageUrl = string.Empty
                };
                order.Items = new List<OrderItem> { orderItem };
            }

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            var invoiceId = $"INV-{order.OrderNumber.Replace("ORD-", "")}";

            return CreatedAtAction(nameof(GetById), new { id = order.Id }, new
            {
                Id = order.Id,
                InvoiceId = invoiceId,
                Client = clientNameTrimmed,
                Email = customer.Email,
                Date = order.OrderDate.ToString("yyyy-MM-dd"),
                Billed = $"Rs. {order.FinalAmount:N0}",
                Status = request.PaymentStatus ?? "Unpaid"
            });
        }

        // PUT: api/Invoices/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] InvoiceUpdateRequest request)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
            {
                return NotFound(new { Message = "Invoice/Order not found." });
            }

            if (!string.IsNullOrEmpty(request.Status))
            {
                if (request.Status.Equals("Paid", StringComparison.OrdinalIgnoreCase))
                {
                    order.PaymentStatus = "Paid";
                }
                else if (request.Status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
                {
                    order.Status = "Cancelled";
                }
                else
                {
                    order.PaymentStatus = "Pending";
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/Invoices/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
            {
                return NotFound(new { Message = "Invoice/Order not found." });
            }

            order.Status = "Cancelled";
            await _context.SaveChangesAsync();
            return NoContent();
        }

        public class InvoiceItemRequest
        {
            public int ProductId { get; set; }
            public string? ProductName { get; set; }
            public string? ProductCode { get; set; }
            public int Quantity { get; set; } = 1;
            public decimal Price { get; set; }
        }

        public class InvoiceCreateRequest
        {
            public string? InvoiceNo { get; set; }
            public DateTime? Date { get; set; }
            public string? PaymentStatus { get; set; } // Unpaid, Paid, Cancelled
            public string ClientName { get; set; } = string.Empty;
            public string EmailAddress { get; set; } = string.Empty;
            public string ContactNo { get; set; } = string.Empty;
            public string? Address { get; set; }
            public string? PostalCode { get; set; }
            public string? TaxNumber { get; set; }
            public string? BillingName { get; set; }
            public string? BillingAddress { get; set; }
            public string? BillingPhone { get; set; }
            public string? BillingTaxNumber { get; set; }
            public string? BillingEmail { get; set; }
            public string? ShippingName { get; set; }
            public string? ShippingAddress { get; set; }
            public string? ShippingPhone { get; set; }
            public string? ShippingTaxNumber { get; set; }
            public string? ShippingEmail { get; set; }
            public string? PaymentMethod { get; set; }
            public string? TransactionRef { get; set; }
            public string? PaymentDate { get; set; }
            public decimal SubTotal { get; set; }
            public decimal TaxAmount { get; set; }
            public decimal Discount { get; set; }
            public decimal ShippingCharge { get; set; }
            public decimal TotalAmount { get; set; }
            public string? Notes { get; set; }
            public List<InvoiceItemRequest>? Items { get; set; }
        }

        public class InvoiceUpdateRequest
        {
            public string? Status { get; set; } // Paid, Unpaid, Cancelled
        }
    }
}
