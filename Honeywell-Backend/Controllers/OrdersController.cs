using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Honeywell.Data;
using Honeywell.Models;

namespace Honeywell.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private static readonly System.Text.Json.JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public OrdersController(ApplicationDbContext context)
        {
            _context = context;
        }

        private async Task<OrderStatusUpdateRequest> GetStatusUpdateRequestAsync()
        {
            if (Request.HasFormContentType)
            {
                var form = await Request.ReadFormAsync();
                string GetFormVal(string key)
                {
                    if (form.TryGetValue(key, out var val)) return val.ToString();
                    foreach (var k in form.Keys)
                    {
                        if (k.Equals(key, StringComparison.OrdinalIgnoreCase))
                            return form[k].ToString();
                    }
                    return string.Empty;
                }

                return new OrderStatusUpdateRequest
                {
                    Status = GetFormVal("Status"),
                    TrackingNumber = GetFormVal("TrackingNumber"),
                    CarrierName = GetFormVal("CarrierName")
                };
            }
            else
            {
                try
                {
                    return await Request.ReadFromJsonAsync<OrderStatusUpdateRequest>(_jsonOptions) ?? new OrderStatusUpdateRequest();
                }
                catch
                {
                    return new OrderStatusUpdateRequest();
                }
            }
        }

        // GET: api/Orders/my-orders?email=&phone=&mobile=&customerId=
        [HttpGet("my-orders")]
        public async Task<IActionResult> GetMyOrders([FromQuery] string? email, [FromQuery] string? phone, [FromQuery] string? mobile, [FromQuery] int? customerId)
        {
            var targetPhone = phone ?? mobile;
            var query = _context.Orders
                .AsNoTracking()
                .Include(o => o.Customer)
                .Include(o => o.Items)
                .AsQueryable();

            if (customerId.HasValue && customerId.Value > 0)
            {
                query = query.Where(o => o.CustomerId == customerId.Value);
            }
            else if (!string.IsNullOrEmpty(email))
            {
                query = query.Where(o => o.Customer != null && o.Customer.Email.ToLower() == email.ToLower());
            }
            else if (!string.IsNullOrEmpty(targetPhone))
            {
                query = query.Where(o => o.Customer != null && o.Customer.Phone.Contains(targetPhone));
            }

            var orders = await query.OrderByDescending(o => o.OrderDate).ToListAsync();
            await PopulateItemImagesAsync(orders);

            return Ok(orders);
        }

        // GET: api/Orders?status=&search=&dateBooked=&startDate=&endDate=
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? status, 
            [FromQuery] string? search,
            [FromQuery] string? dateBooked = "All",
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            // 1. Calculate dashboard metrics from the database (all orders)
            var allOrders = await _context.Orders.AsNoTracking().ToListAsync();
            var verifiedRevenue = allOrders
                .Where(o => o.Status != "Cancelled" && (o.PaymentStatus.Equals("Paid", StringComparison.OrdinalIgnoreCase) || o.PaymentStatus.Equals("Success", StringComparison.OrdinalIgnoreCase) || o.PaymentStatus.Equals("Verified Paid", StringComparison.OrdinalIgnoreCase)))
                .Sum(o => o.FinalAmount);

            var processingCount = allOrders.Count(o => o.Status.Equals("Processing", StringComparison.OrdinalIgnoreCase));
            var dispatchedCount = allOrders.Count(o => o.Status.Equals("Dispatched", StringComparison.OrdinalIgnoreCase));
            var completedCount = allOrders.Count(o => o.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase) || o.Status.Equals("Delivered", StringComparison.OrdinalIgnoreCase));

            // 2. Query orders for the grid list
            var query = _context.Orders
                .AsNoTracking()
                .Include(o => o.Customer)
                    .ThenInclude(c => c!.User)
                .Include(o => o.Items)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(o => o.Status == status);
            }

            if (!string.IsNullOrEmpty(search))
            {
                var s = search.ToLower();
                query = query.Where(o => 
                    o.OrderNumber.ToLower().Contains(s) || 
                    (o.Customer != null && o.Customer.Name.ToLower().Contains(s)) ||
                    (o.Customer != null && o.Customer.Phone.Contains(s))
                );
            }

            // Apply Date Booked filter
            var now = DateTime.UtcNow;
            if (!string.IsNullOrEmpty(dateBooked) && !dateBooked.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                switch (dateBooked.ToLower())
                {
                    case "today":
                        query = query.Where(o => o.OrderDate.Date == now.Date);
                        break;
                    case "week":
                        var startOfWeek = now.AddDays(-(int)now.DayOfWeek);
                        query = query.Where(o => o.OrderDate >= startOfWeek);
                        break;
                    case "month":
                        query = query.Where(o => o.OrderDate.Year == now.Year && o.OrderDate.Month == now.Month);
                        break;
                    case "custom":
                        if (startDate.HasValue)
                        {
                            query = query.Where(o => o.OrderDate >= startDate.Value);
                        }
                        if (endDate.HasValue)
                        {
                            query = query.Where(o => o.OrderDate <= endDate.Value);
                        }
                        break;
                }
            }

            var ordersList = await query.OrderByDescending(o => o.OrderDate).ToListAsync();
            await PopulateItemImagesAsync(ordersList);

            // Format results for UI presentation
            var formattedOrders = ordersList.Select(o => {
                var displayRole = "Grower";
                if (o.Customer != null && o.Customer.User != null)
                {
                    // Map "Grower" to "Farmer" as shown in the UI screen, or keep custom roles
                    displayRole = o.Customer.User.Role.Equals("Grower", StringComparison.OrdinalIgnoreCase) ? "Farmer" : o.Customer.User.Role;
                }

                var cleanOrderNum = o.OrderNumber.Replace("#", "").Trim();
                var invoiceNumber = cleanOrderNum.StartsWith("ORD-") 
                    ? cleanOrderNum.Replace("ORD-", "INV-") 
                    : $"INV-{cleanOrderNum}";

                var displayPaymentStatus = "Pending";
                if (o.PaymentStatus.Equals("Paid", StringComparison.OrdinalIgnoreCase) || o.PaymentStatus.Equals("Success", StringComparison.OrdinalIgnoreCase) || o.PaymentStatus.Equals("Verified Paid", StringComparison.OrdinalIgnoreCase))
                {
                    displayPaymentStatus = "Verified Paid";
                }
                else if (o.PaymentStatus.Equals("PendingVerification", StringComparison.OrdinalIgnoreCase))
                {
                    displayPaymentStatus = "Pending Verification";
                }

                var displayPaymentMethod = o.PaymentMethod;
                if (o.PaymentMethod.Equals("QRPayment", StringComparison.OrdinalIgnoreCase) || o.PaymentMethod.Equals("UPI", StringComparison.OrdinalIgnoreCase))
                {
                    displayPaymentMethod = "UPI / Bank Transfer";
                }

                return new
                {
                    o.Id,
                    OrderNumber = o.OrderNumber.StartsWith("#") ? o.OrderNumber : $"#{o.OrderNumber}",
                    InvoiceNumber = invoiceNumber,
                    CustomerName = o.Customer?.Name ?? "Walk-in Customer",
                    CustomerRole = displayRole,
                    CustomerPhone = o.Customer?.Phone ?? "",
                    DateBooked = o.OrderDate.ToString("yyyy-MM-dd"),
                    LogisticsPartner = string.IsNullOrEmpty(o.CarrierName) ? "Not Assigned" : o.CarrierName,
                    PaymentStatus = displayPaymentStatus,
                    PaymentMethod = displayPaymentMethod,
                    TotalAmount = $"INR {o.FinalAmount:N0}",
                    Fulfillment = o.Status.ToUpper(),
                    Items = o.Items
                };
            }).ToList();

            return Ok(new
            {
                VerifiedRevenue = $"INR {verifiedRevenue:N0}",
                ProcessingCount = processingCount,
                DispatchedCount = dispatchedCount,
                CompletedCount = completedCount,
                Orders = formattedOrders
            });
        }

        // GET: api/Orders/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Order>> GetById(int id)
        {
            var order = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound(new { Message = "Order not found." });
            }

            await PopulateItemImagesAsync(new[] { order });

            // Resolve Return eligibility metadata for every item in order
            bool isDelivered = order.Status.Equals("Delivered", StringComparison.OrdinalIgnoreCase) || 
                               order.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase);

            var deliveredLog = await _context.OrderTrackingLogs
                .FirstOrDefaultAsync(l => l.OrderId == order.Id && l.Status.ToLower() == "delivered");
            var deliveredDate = deliveredLog?.CreatedAt ?? order.OrderDate.AddDays(2);
            var returnWindowEndsAt = deliveredDate.AddDays(7); // 7 days return window
            bool isWindowActive = DateTime.UtcNow <= returnWindowEndsAt;

            foreach (var item in order.Items)
            {
                var returnReq = await _context.ReturnRequests
                    .FirstOrDefaultAsync(r => r.OrderItemId == item.Id);

                if (returnReq != null)
                {
                    item.ReturnEligible = false;
                    item.ReplacementEligible = false;
                    item.ReturnWindowEndsAt = returnWindowEndsAt;
                    item.ReturnRequestId = returnReq.Id;
                    item.ReturnRequestNumber = returnReq.RequestNumber;
                    item.ReturnRequestType = returnReq.RequestType;
                    item.ReturnRequestStatus = returnReq.Status;
                }
                else
                {
                    item.ReturnEligible = isDelivered && isWindowActive;
                    item.ReplacementEligible = isDelivered && isWindowActive;
                    item.ReturnWindowEndsAt = returnWindowEndsAt;
                    item.ReturnRequestId = null;
                    item.ReturnRequestNumber = null;
                    item.ReturnRequestType = null;
                    item.ReturnRequestStatus = null;
                }
            }

            return Ok(order);
        }

        // GET: api/Orders/tracking?search=
        [HttpGet("tracking")]
        public async Task<IActionResult> GetTrackingOrders([FromQuery] string? search)
        {
            var query = _context.Orders
                .Include(o => o.Customer)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                var s = search.ToLower();
                query = query.Where(o => 
                    o.OrderNumber.ToLower().Contains(s) || 
                    (o.Customer != null && o.Customer.Name.ToLower().Contains(s))
                );
            }

            var orders = await query.OrderByDescending(o => o.OrderDate).ToListAsync();
            var formatted = orders.Select(o => new
            {
                o.Id,
                OrderNumber = o.OrderNumber.StartsWith("#") ? o.OrderNumber : $"#{o.OrderNumber}",
                CustomerName = o.Customer?.Name ?? "Walk-in Customer",
                CustomerPhone = o.Customer?.Phone ?? "",
                FinalAmount = o.FinalAmount,
                Status = o.Status.ToUpper()
            }).ToList();

            return Ok(formatted);
        }

        // GET: api/Orders/tracking/{id}
        [HttpGet("tracking/{id}")]
        public async Task<IActionResult> GetTrackingDetails(int id)
        {
            var order = await _context.Orders
                .Include(o => o.Customer)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound(new { Message = "Order not found." });
            }

            var timelineLogs = await _context.OrderTrackingLogs
                .Where(log => log.OrderId == id)
                .OrderBy(log => log.CreatedAt)
                .Select(log => new
                {
                    log.Id,
                    log.Status,
                    log.Description,
                    Date = log.CreatedAt.ToString("yyyy-MM-dd"),
                    Time = log.CreatedAt.ToString("HH:mm:ss")
                })
                .ToListAsync();

            return Ok(new
            {
                OrderId = order.Id,
                OrderNumber = order.OrderNumber.StartsWith("#") ? order.OrderNumber : $"#{order.OrderNumber}",
                CustomerName = order.Customer?.Name ?? "Walk-in Customer",
                CustomerPhone = order.Customer?.Phone ?? "",
                CurrentStatus = order.Status.ToUpper(),
                TimelineLogs = timelineLogs
            });
        }

        // POST: api/Orders/tracking/{id}
        [HttpPost("tracking/{id}")]
        public async Task<IActionResult> PublishTrackingUpdate(int id, [FromBody] TrackingUpdateRequest request)
        {
            var order = await _context.Orders
                .Include(o => o.Customer)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound(new { Message = "Order not found." });
            }

            if (string.IsNullOrEmpty(request.Status))
            {
                return BadRequest(new { Message = "Status is required." });
            }

            // Update order status
            order.Status = request.Status;

            // Generate standard description if notes are left blank
            var description = request.Notes;
            if (string.IsNullOrEmpty(description))
            {
                description = request.Status.ToLower() switch
                {
                    "pending" => "Order has been received.",
                    "processing" => "Order is verified. Inventory is being committed and prepared.",
                    "packed" => "Order package has been packed and prepared for transit.",
                    "shipped" => "Order package has been handed over to the courier partner.",
                    "dispatched" => "Order package has been dispatched from Nagpur warehouse.",
                    "completed" => "Order has been successfully delivered.",
                    "delivered" => "Order has been successfully delivered.",
                    "cancelled" => "Order has been cancelled.",
                    _ => $"Fulfillment stage updated to {request.Status}."
                };
            }

            // Save new timeline log
            var log = new OrderTrackingLog
            {
                OrderId = id,
                Status = request.Status,
                Description = description,
                CreatedAt = DateTime.UtcNow
            };

            _context.OrderTrackingLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Tracking status updated successfully.",
                CurrentStatus = order.Status.ToUpper(),
                NewLog = new
                {
                    log.Id,
                    log.Status,
                    log.Description,
                    Date = log.CreatedAt.ToString("yyyy-MM-dd"),
                    Time = log.CreatedAt.ToString("HH:mm:ss")
                }
            });
        }

        public class TrackingUpdateRequest
        {
            public string Status { get; set; } = string.Empty;
            public string? Notes { get; set; }
        }

        // GET: api/Orders/shipping?search=
        [HttpGet("shipping")]
        public async Task<IActionResult> GetShippingOrders([FromQuery] string? search)
        {
            var query = _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Items)
                .Where(o => o.Status != "Cancelled" && o.Status != "Delivered" && o.Status != "Completed" && o.Status != "Dispatched")
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                var s = search.ToLower();
                query = query.Where(o => 
                    o.OrderNumber.ToLower().Contains(s) || 
                    (o.Customer != null && o.Customer.Name.ToLower().Contains(s))
                );
            }

            var orders = await query.OrderByDescending(o => o.OrderDate).ToListAsync();
            var formatted = orders.Select(o => {
                var displayStatus = o.Status.Equals("Packed", StringComparison.OrdinalIgnoreCase) 
                    ? "TO BE SHIPPED" 
                    : "TO BE PACKED";

                return new
                {
                    o.Id,
                    OrderNumber = o.OrderNumber.StartsWith("#") ? o.OrderNumber : $"#{o.OrderNumber}",
                    CustomerName = o.Customer?.Name ?? "Unknown",
                    ItemsCount = $"{o.Items?.Count ?? 0} items",
                    Status = displayStatus
                };
            }).ToList();

            return Ok(formatted);
        }

        // GET: api/Orders/shipping/{id}
        [HttpGet("shipping/{id}")]
        public async Task<IActionResult> GetShippingDetails(int id)
        {
            var order = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound(new { Message = "Order not found." });
            }

            var packageContent = order.Items.Select(i => new
            {
                ProductName = i.ProductName,
                ProductCode = i.ProductCode ?? "FERT-001",
                Quantity = i.Quantity
            }).ToList();

            return Ok(new
            {
                OrderId = order.Id,
                OrderNumber = order.OrderNumber.StartsWith("#") ? order.OrderNumber : $"#{order.OrderNumber}",
                CustomerName = order.Customer?.Name ?? "Unknown",
                Destination = order.ShippingAddress,
                CurrentStatus = order.Status.ToUpper(),
                PackageContent = packageContent,
                PackerName = order.PackerName,
                PackerPhotoUrl = order.PackerPhotoUrl,
                PackagePhotoUrl = order.PackagePhotoUrl,
                CarrierName = order.CarrierName,
                TrackingNumber = order.TrackingNumber
            });
        }

        // POST: api/Orders/shipping/{id}/pack
        [HttpPost("shipping/{id}/pack")]
        public async Task<IActionResult> ConfirmPacked(int id, [FromForm] PackOrderRequest request)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
            {
                return NotFound(new { Message = "Order not found." });
            }

            if (string.IsNullOrEmpty(request.PackerName))
            {
                return BadRequest(new { Message = "Packer Name is required." });
            }

            var photoUrl = await SaveUploadedFileAsync(request.PackerPhoto);

            order.Status = "Packed";
            order.PackerName = request.PackerName;
            if (!string.IsNullOrEmpty(photoUrl))
            {
                order.PackerPhotoUrl = photoUrl;
            }

            // Save timeline log
            var log = new OrderTrackingLog
            {
                OrderId = id,
                Status = "Packed",
                Description = $"Order package has been successfully packed by {request.PackerName}.",
                CreatedAt = DateTime.UtcNow
            };

            _context.OrderTrackingLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Order marked as Packed successfully.",
                Status = order.Status.ToUpper(),
                PackerName = order.PackerName,
                PackerPhotoUrl = order.PackerPhotoUrl
            });
        }

        // POST: api/Orders/shipping/{id}/dispatch
        [HttpPost("shipping/{id}/dispatch")]
        public async Task<IActionResult> ConfirmDispatched(int id, [FromForm] DispatchOrderRequest request)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
            {
                return NotFound(new { Message = "Order not found." });
            }

            if (string.IsNullOrEmpty(request.CarrierName) || string.IsNullOrEmpty(request.TrackingNumber))
            {
                return BadRequest(new { Message = "Carrier Name and Tracking Number are required." });
            }

            var photoUrl = await SaveUploadedFileAsync(request.PackagePhoto);

            order.Status = "Dispatched";
            order.CarrierName = request.CarrierName;
            order.TrackingNumber = request.TrackingNumber;
            if (!string.IsNullOrEmpty(photoUrl))
            {
                order.PackagePhotoUrl = photoUrl;
            }

            // Save timeline log
            var log = new OrderTrackingLog
            {
                OrderId = id,
                Status = "Dispatched",
                Description = $"Order package has been dispatched via {request.CarrierName} (Tracking ID: {request.TrackingNumber}).",
                CreatedAt = DateTime.UtcNow
            };

            _context.OrderTrackingLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Order dispatched successfully.",
                Status = order.Status.ToUpper(),
                CarrierName = order.CarrierName,
                TrackingNumber = order.TrackingNumber,
                PackagePhotoUrl = order.PackagePhotoUrl
            });
        }

        private async Task<string?> SaveUploadedFileAsync(IFormFile? file)
        {
            if (file == null || file.Length == 0) return null;

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            return $"/uploads/{uniqueFileName}";
        }

        public class PackOrderRequest
        {
            public string PackerName { get; set; } = string.Empty;
            public IFormFile? PackerPhoto { get; set; }
        }

        public class DispatchOrderRequest
        {
            public string CarrierName { get; set; } = string.Empty;
            public string TrackingNumber { get; set; } = string.Empty;
            public IFormFile? PackagePhoto { get; set; }
        }

        public class OrderCheckoutRequest
        {
            public int CustomerId { get; set; }
            public string? CustomerName { get; set; }
            public string? Email { get; set; }
            public string? Mobile { get; set; }
            public string? Phone { get; set; }
            public string? OrderNumber { get; set; }
            public string? ShippingAddress { get; set; }
            public string? Address { get; set; }
            public string? City { get; set; }
            public string? State { get; set; }
            public string? PinCode { get; set; }
            public decimal? TotalAmount { get; set; }
            public decimal? DiscountAmount { get; set; }
            public decimal? ShippingFee { get; set; }
            public decimal? GstAmount { get; set; }
            public decimal? FinalAmount { get; set; }
            public string? Status { get; set; }
            public string? PaymentStatus { get; set; }
            public string? PaymentMethod { get; set; }
            public List<OrderItemRequest>? Items { get; set; }
        }

        public class OrderItemRequest
        {
            public int ProductId { get; set; }
            public string? ProductName { get; set; }
            public string? ProductCode { get; set; }
            public string? CategoryName { get; set; }
            public decimal Price { get; set; }
            public int Quantity { get; set; }
            public decimal Subtotal { get; set; }
            public string? ImageUrl { get; set; }
        }

        // POST: api/Orders
        [HttpPost]
        public async Task<ActionResult<Order>> Create([FromBody] OrderCheckoutRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { Message = "Order payload is required." });
            }

            if (request.Items == null || !request.Items.Any())
            {
                return BadRequest(new { Message = "At least one order item is required." });
            }

            // Customer Resolution
            Customer? customer = null;
            if (request.CustomerId > 0)
            {
                customer = await _context.Customers.FindAsync(request.CustomerId);
            }

            var emailClean = request.Email?.Trim().ToLower();
            var phoneClean = (request.Mobile ?? request.Phone)?.Trim();

            if (customer == null && !string.IsNullOrEmpty(emailClean))
            {
                customer = await _context.Customers.FirstOrDefaultAsync(c => c.Email != null && c.Email.ToLower() == emailClean);
            }

            if (customer == null && !string.IsNullOrEmpty(phoneClean))
            {
                customer = await _context.Customers.FirstOrDefaultAsync(c => c.Phone != null && c.Phone.Contains(phoneClean));
            }

            if (customer == null)
            {
                // Auto-create customer if not found
                var custName = !string.IsNullOrWhiteSpace(request.CustomerName) ? request.CustomerName.Trim() : "Customer";
                var nameParts = custName.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
                var fName = nameParts.Length > 0 ? nameParts[0] : custName;
                var lName = nameParts.Length > 1 ? nameParts[1] : "";

                var fullAddress = request.ShippingAddress;
                if (string.IsNullOrWhiteSpace(fullAddress))
                {
                    var addrParts = new List<string>();
                    if (!string.IsNullOrWhiteSpace(request.Address)) addrParts.Add(request.Address);
                    if (!string.IsNullOrWhiteSpace(request.City)) addrParts.Add(request.City);
                    if (!string.IsNullOrWhiteSpace(request.State)) addrParts.Add(request.State);
                    if (!string.IsNullOrWhiteSpace(request.PinCode)) addrParts.Add(request.PinCode);
                    fullAddress = string.Join(", ", addrParts);
                }

                customer = new Customer
                {
                    Name = custName,
                    FirstName = fName,
                    LastName = lName,
                    Email = emailClean ?? "",
                    Phone = phoneClean ?? "",
                    Address = fullAddress ?? "",
                    JoinDate = DateTime.UtcNow,
                    Role = "CUSTOMER ACCOUNT",
                    Status = "Active"
                };

                _context.Customers.Add(customer);
                await _context.SaveChangesAsync();
            }

            // Load settings
            var settings = await _context.SystemSettings.FirstOrDefaultAsync() ?? new SystemSettings();
            var coinsSettings = await _context.CoinsSettings.FirstOrDefaultAsync() ?? new CoinsSettings();

            var order = new Order
            {
                CustomerId = customer.Id,
                OrderNumber = !string.IsNullOrWhiteSpace(request.OrderNumber)
                    ? request.OrderNumber.Trim()
                    : $"ORD-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(10000, 99999)}",
                OrderDate = DateTime.UtcNow,
                Status = !string.IsNullOrWhiteSpace(request.Status) ? request.Status.Trim() : "Processing",
                PaymentStatus = !string.IsNullOrWhiteSpace(request.PaymentStatus) ? request.PaymentStatus.Trim() : "Pending",
                PaymentMethod = !string.IsNullOrWhiteSpace(request.PaymentMethod) ? request.PaymentMethod.Trim() : "Cash on Delivery",
                DiscountAmount = request.DiscountAmount ?? 0
            };

            // Address construction
            var shippingAddr = request.ShippingAddress;
            if (string.IsNullOrWhiteSpace(shippingAddr))
            {
                var addrParts = new List<string>();
                if (!string.IsNullOrWhiteSpace(request.Address)) addrParts.Add(request.Address);
                if (!string.IsNullOrWhiteSpace(request.City)) addrParts.Add(request.City);
                if (!string.IsNullOrWhiteSpace(request.State)) addrParts.Add(request.State);
                if (!string.IsNullOrWhiteSpace(request.PinCode)) addrParts.Add(request.PinCode);
                shippingAddr = string.Join(", ", addrParts);
            }
            order.ShippingAddress = shippingAddr ?? customer.Address ?? "";

            // Validate and calculate items
            decimal calculatedSubtotal = 0;
            foreach (var itemReq in request.Items)
            {
                var item = new OrderItem
                {
                    ProductId = itemReq.ProductId,
                    ProductName = itemReq.ProductName ?? "",
                    ProductCode = itemReq.ProductCode,
                    CategoryName = itemReq.CategoryName,
                    Price = itemReq.Price,
                    Quantity = itemReq.Quantity,
                    Subtotal = itemReq.Subtotal > 0 ? itemReq.Subtotal : itemReq.Price * itemReq.Quantity,
                    ImageUrl = itemReq.ImageUrl ?? ""
                };

                var dbProduct = await _context.Products
                    .Include(p => p.Category)
                    .FirstOrDefaultAsync(p => p.Id == itemReq.ProductId);

                if (dbProduct != null)
                {
                    if (string.IsNullOrEmpty(item.ProductName)) item.ProductName = dbProduct.ProductName;
                    if (string.IsNullOrEmpty(item.ProductCode)) item.ProductCode = dbProduct.SKU;
                    if (string.IsNullOrEmpty(item.CategoryName)) item.CategoryName = dbProduct.Category?.Name ?? "General";
                    if (item.Price <= 0) item.Price = dbProduct.SellingPrice ?? dbProduct.MRP;

                    // Deduct stock
                    dbProduct.Stock -= item.Quantity;
                    if (dbProduct.Stock < 0) dbProduct.Stock = 0;

                    // Low stock warning
                    if (dbProduct.Stock <= 10)
                    {
                        var existsLowStock = await _context.Notifications.AnyAsync(
                            n => n.Type == "LowStock" && n.Message.Contains(dbProduct.ProductName) && !n.IsRead);
                        if (!existsLowStock)
                        {
                            _context.Notifications.Add(new Notification
                            {
                                Title = "Low Stock Warning",
                                Message = $"{dbProduct.ProductName} is below safety threshold limit ({dbProduct.Stock} left).",
                                Type = "LowStock"
                            });
                        }
                    }
                }
                else
                {
                    if (string.IsNullOrEmpty(item.ProductName)) item.ProductName = "Product #" + itemReq.ProductId;
                    if (string.IsNullOrEmpty(item.ProductCode)) item.ProductCode = "SKU-" + itemReq.ProductId;
                    if (string.IsNullOrEmpty(item.CategoryName)) item.CategoryName = "General";
                }

                item.Subtotal = item.Price * item.Quantity;
                calculatedSubtotal += item.Subtotal;
                order.Items.Add(item);
            }

            order.TotalAmount = request.TotalAmount.HasValue && request.TotalAmount.Value > 0
                ? request.TotalAmount.Value
                : calculatedSubtotal;

            order.ShippingFee = request.ShippingFee.HasValue
                ? request.ShippingFee.Value
                : (calculatedSubtotal >= 2000 ? 0 : settings.FlatShippingFee);

            decimal taxableAmount = order.TotalAmount - order.DiscountAmount;
            if (taxableAmount < 0) taxableAmount = 0;

            order.GstAmount = request.GstAmount.HasValue
                ? request.GstAmount.Value
                : Math.Round(taxableAmount * (settings.GstPercentage / 100.0m), 2);

            order.FinalAmount = request.FinalAmount.HasValue && request.FinalAmount.Value > 0
                ? request.FinalAmount.Value
                : taxableAmount + order.ShippingFee + order.GstAmount;

            // Loyalty coins reward
            int coinsEarned = (int)(order.FinalAmount * coinsSettings.EarnRate);
            customer.CoinsBalance += coinsEarned;

            _context.Orders.Add(order);

            // Add initial timeline tracking log
            var initialLog = new OrderTrackingLog
            {
                OrderId = order.Id,
                Status = order.Status,
                Description = $"Order #{order.OrderNumber} placed successfully via {order.PaymentMethod}.",
                CreatedAt = DateTime.UtcNow
            };
            _context.OrderTrackingLogs.Add(initialLog);

            // Add notification
            _context.Notifications.Add(new Notification
            {
                Title = "New Order Placed",
                Message = $"Order #{order.OrderNumber} placed by customer {customer.Name} (Total: INR {order.FinalAmount:N2}).",
                Type = "NewOrder"
            });

            await _context.SaveChangesAsync();
            await _context.Entry(order).Reference(o => o.Customer).LoadAsync();
            await PopulateItemImagesAsync(new[] { order });

            return Ok(order);
        }

        // PUT: api/Orders/5/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id)
        {
            var request = await GetStatusUpdateRequestAsync();
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
            {
                return NotFound(new { Message = "Order not found." });
            }

            if (string.IsNullOrEmpty(request.Status))
            {
                return BadRequest(new { Message = "Status is required." });
            }

            order.Status = request.Status;

            if (!string.IsNullOrEmpty(request.TrackingNumber))
                order.TrackingNumber = request.TrackingNumber;

            if (!string.IsNullOrEmpty(request.CarrierName))
                order.CarrierName = request.CarrierName;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/Orders/5  (cancel order & restore stock)
        [HttpDelete("{id}")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound(new { Message = "Order not found." });
            }

            if (order.Status == "Cancelled")
            {
                return BadRequest(new { Message = "Order is already cancelled." });
            }

            // Stock restoration removed since Product table is removed

            order.Status = "Cancelled";
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task PopulateItemImagesAsync(IEnumerable<Order> orders)
        {
            var productIds = orders.SelectMany(o => o.Items).Select(i => i.ProductId).Distinct().ToList();
            if (!productIds.Any()) return;

            var productImages = await _context.ProductImages
                .Where(img => productIds.Contains(img.ProductId))
                .GroupBy(img => img.ProductId)
                .Select(g => new { ProductId = g.Key, ImageUrl = g.OrderBy(img => img.Id).Select(img => img.ImageUrl).FirstOrDefault() })
                .ToDictionaryAsync(x => x.ProductId, x => x.ImageUrl);

            foreach (var order in orders)
            {
                foreach (var item in order.Items)
                {
                    if (productImages.TryGetValue(item.ProductId, out var imgUrl))
                    {
                        item.ImageUrl = imgUrl ?? string.Empty;
                    }
                }
            }
        }
    }
}

