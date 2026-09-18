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
    [Route("api/Customer")]
    public class CustomerPortalController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CustomerPortalController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. Sign In Modal (Customer Login)
        // POST: api/Customer/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] CustomerLoginDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.EmailOrPhone) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { success = false, message = "Email/Mobile and Password are required." });
            }

            var identifier = dto.EmailOrPhone.Trim().ToLower();
            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => (c.Email != null && c.Email.ToLower() == identifier) || c.Phone == identifier);

            if (customer == null)
            {
                return Unauthorized(new { success = false, message = "Invalid email/mobile or password." });
            }

            if (!string.IsNullOrEmpty(customer.Password) && customer.Password != dto.Password)
            {
                return Unauthorized(new { success = false, message = "Invalid email/mobile or password." });
            }

            return Ok(new
            {
                success = true,
                message = "Login successful",
                token = "mock-jwt-customer-token-" + customer.Id,
                customer = new
                {
                    customer.Id,
                    customer.Name,
                    customer.FirstName,
                    customer.LastName,
                    customer.Email,
                    customer.Phone,
                    customer.Role,
                    customer.Gender,
                    customer.CompanyOrganization,
                    customer.Status
                }
            });
        }

        // 2. Create Account Modal (Customer Register)
        // POST: api/Customer/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] CustomerRegisterDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.EmailOrPhone) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { success = false, message = "Full Name, Email/Phone, and Password are required." });
            }

            var identifier = dto.EmailOrPhone.Trim().ToLower();
            var existing = await _context.Customers
                .FirstOrDefaultAsync(c => (c.Email != null && c.Email.ToLower() == identifier) || c.Phone == identifier);

            if (existing != null)
            {
                return BadRequest(new { success = false, message = "An account with this Email or Phone already exists." });
            }

            var nameParts = (dto.FullName ?? "").Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
            var firstName = nameParts.Length > 0 ? nameParts[0] : (dto.FullName ?? "");
            var lastName = nameParts.Length > 1 ? nameParts[1] : "";

            var isEmail = dto.EmailOrPhone.Contains("@");

            var newCustomer = new Customer
            {
                Name = dto.FullName ?? "Customer",
                FirstName = firstName,
                LastName = lastName,
                Email = isEmail ? dto.EmailOrPhone : (dto.Email ?? ""),
                Phone = !isEmail ? dto.EmailOrPhone : (dto.Phone ?? ""),
                Password = dto.Password,
                Role = "CUSTOMER ACCOUNT",
                Status = "Active",
                JoinDate = DateTime.UtcNow,
                Gender = dto.Gender ?? "Male",
                CompanyOrganization = dto.CompanyOrganization ?? "Individual Account",
                Address = "",
                District = "",
                State = "",
                ProfilePicture = ""
            };

            _context.Customers.Add(newCustomer);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Account created successfully",
                customer = newCustomer
            });
        }

        // Unified My Profile (Personal Details + Addresses + Bank Details)
        // GET: api/Customer/myprofile
        // GET: api/Customer/my-profile
        [HttpGet("myprofile")]
        [HttpGet("my-profile")]
        public async Task<IActionResult> GetMyProfile([FromQuery] int? customerId, [FromQuery] string? email)
        {
            Customer? customer = null;
            if (customerId.HasValue && customerId.Value > 0)
            {
                customer = await _context.Customers.FindAsync(customerId.Value);
            }
            else if (!string.IsNullOrWhiteSpace(email))
            {
                customer = await _context.Customers.FirstOrDefaultAsync(c => c.Email != null && c.Email.ToLower() == email.Trim().ToLower());
            }

            if (customer == null && User?.Identity?.IsAuthenticated == true && !string.IsNullOrWhiteSpace(User.Identity.Name))
            {
                var ident = User.Identity.Name.Trim().ToLower();
                customer = await _context.Customers.FirstOrDefaultAsync(c => (c.Email != null && c.Email.ToLower() == ident) || c.Phone == ident);
            }

            if (customer == null)
            {
                customer = await _context.Customers.FirstOrDefaultAsync();
            }

            if (customer == null)
            {
                return NotFound(new { success = false, message = "Customer profile not found." });
            }

            var displayName = !string.IsNullOrWhiteSpace(customer.Name) 
                ? customer.Name 
                : (!string.IsNullOrWhiteSpace(customer.Email) ? customer.Email.Split('@')[0] : "Customer");

            var firstName = !string.IsNullOrWhiteSpace(customer.FirstName) 
                ? customer.FirstName 
                : (!string.IsNullOrWhiteSpace(customer.Name) ? customer.Name.Split(' ')[0] : "");

            var lastName = !string.IsNullOrWhiteSpace(customer.LastName) 
                ? customer.LastName 
                : (customer.Name != null && customer.Name.Contains(' ') ? customer.Name.Split(' ', 2)[1] : "");

            var shippingAddress = customer.ShippingAddressJson;
            var billingAddress = customer.BillingAddressJson;
            bool isShippingAdded = !string.IsNullOrWhiteSpace(shippingAddress);
            bool isBillingAdded = !string.IsNullOrWhiteSpace(billingAddress);

            bool isBankConfigured = !string.IsNullOrWhiteSpace(customer.AccountNumber);
            bool isUpiConfigured = !string.IsNullOrWhiteSpace(customer.UpiId);

            return Ok(new
            {
                personalDetails = new
                {
                    id = customer.Id,
                    displayName = displayName,
                    email = customer.Email ?? "",
                    roleTag = customer.Role ?? "CUSTOMER ACCOUNT",
                    firstName = firstName,
                    lastName = lastName,
                    emailAddress = customer.Email ?? "",
                    mobileNumber = customer.Phone ?? "",
                    gender = customer.Gender ?? "",
                    companyOrganization = customer.CompanyOrganization ?? "",
                    status = customer.Status ?? "Active",
                    joinDate = customer.JoinDate
                },
                addresses = new
                {
                    shippingAddressStatus = isShippingAdded ? "ADDED" : "NOT ADDED",
                    billingAddressStatus = isBillingAdded ? "ADDED" : "NOT ADDED",
                    shippingAddress = isShippingAdded ? shippingAddress : null,
                    billingAddress = isBillingAdded ? billingAddress : null
                },
                bankAndPaymentDetails = new
                {
                    bankAccountStatus = isBankConfigured ? "CONFIGURED" : "NOT CONFIGURED",
                    upiHandleStatus = isUpiConfigured ? "CONFIGURED" : "NOT CONFIGURED",
                    bankAccountInfo = new
                    {
                        accountHolderName = customer.AccountHolderName ?? "",
                        bankName = customer.BankName ?? "",
                        accountNumber = customer.AccountNumber ?? "",
                        ifscCode = customer.IfscCode ?? ""
                    },
                    upiPaymentHandle = new
                    {
                        upiId = customer.UpiId ?? ""
                    }
                }
            });
        }

        // 3. My Profile -> Personal Details Tab
        // GET: api/Customer/profile
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile([FromQuery] int? customerId, [FromQuery] string? email)
        {
            Customer? customer = null;
            if (customerId.HasValue && customerId.Value > 0)
            {
                customer = await _context.Customers.FindAsync(customerId.Value);
            }
            else if (!string.IsNullOrWhiteSpace(email))
            {
                customer = await _context.Customers.FirstOrDefaultAsync(c => c.Email != null && c.Email.ToLower() == email.Trim().ToLower());
            }

            if (customer == null && User?.Identity?.IsAuthenticated == true && !string.IsNullOrWhiteSpace(User.Identity.Name))
            {
                var ident = User.Identity.Name.Trim().ToLower();
                customer = await _context.Customers.FirstOrDefaultAsync(c => (c.Email != null && c.Email.ToLower() == ident) || c.Phone == ident);
            }

            if (customer == null)
            {
                customer = await _context.Customers.FirstOrDefaultAsync();
            }

            if (customer == null)
            {
                return NotFound(new { success = false, message = "Customer profile not found." });
            }

            var displayName = !string.IsNullOrWhiteSpace(customer.Name) 
                ? customer.Name 
                : (!string.IsNullOrWhiteSpace(customer.Email) ? customer.Email.Split('@')[0] : "Customer");

            var firstName = !string.IsNullOrWhiteSpace(customer.FirstName) 
                ? customer.FirstName 
                : (!string.IsNullOrWhiteSpace(customer.Name) ? customer.Name.Split(' ')[0] : "");

            var lastName = !string.IsNullOrWhiteSpace(customer.LastName) 
                ? customer.LastName 
                : (customer.Name != null && customer.Name.Contains(' ') ? customer.Name.Split(' ', 2)[1] : "");

            return Ok(new
            {
                id = customer.Id,
                displayName = displayName,
                email = customer.Email ?? "",
                roleTag = customer.Role ?? "CUSTOMER ACCOUNT",
                firstName = firstName,
                lastName = lastName,
                emailAddress = customer.Email ?? "",
                mobileNumber = customer.Phone ?? "",
                gender = customer.Gender ?? "",
                companyOrganization = customer.CompanyOrganization ?? "",
                status = customer.Status ?? "Active",
                joinDate = customer.JoinDate
            });
        }

        // PUT: api/Customer/profile
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateCustomerProfileDto dto, [FromQuery] int? customerId)
        {
            Customer? customer = null;
            if (customerId.HasValue && customerId.Value > 0)
            {
                customer = await _context.Customers.FindAsync(customerId.Value);
            }
            else if (dto != null && !string.IsNullOrWhiteSpace(dto.EmailAddress))
            {
                customer = await _context.Customers.FirstOrDefaultAsync(c => c.Email != null && c.Email.ToLower() == dto.EmailAddress.Trim().ToLower());
            }

            if (customer == null)
            {
                customer = await _context.Customers.FirstOrDefaultAsync();
            }

            if (customer == null)
            {
                return NotFound(new { success = false, message = "Customer profile not found." });
            }

            if (dto != null)
            {
                if (!string.IsNullOrWhiteSpace(dto.FirstName)) customer.FirstName = dto.FirstName;
                if (!string.IsNullOrWhiteSpace(dto.LastName)) customer.LastName = dto.LastName;
                customer.Name = $"{customer.FirstName} {customer.LastName}".Trim();
                if (!string.IsNullOrWhiteSpace(dto.EmailAddress)) customer.Email = dto.EmailAddress;
                if (!string.IsNullOrWhiteSpace(dto.MobileNumber)) customer.Phone = dto.MobileNumber;
                if (!string.IsNullOrWhiteSpace(dto.Gender)) customer.Gender = dto.Gender;
                if (!string.IsNullOrWhiteSpace(dto.CompanyOrganization)) customer.CompanyOrganization = dto.CompanyOrganization;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Profile updated successfully",
                data = customer
            });
        }

        // 4. My Profile -> Addresses (Shipping & Billing) Tab
        // GET: api/Customer/addresses
        [HttpGet("addresses")]
        public async Task<IActionResult> GetAddresses([FromQuery] int? customerId)
        {
            Customer? customer = null;
            if (customerId.HasValue && customerId.Value > 0)
            {
                customer = await _context.Customers.FindAsync(customerId.Value);
            }

            if (customer == null)
            {
                customer = await _context.Customers.FirstOrDefaultAsync();
            }

            var shippingAddress = customer?.ShippingAddressJson;
            var billingAddress = customer?.BillingAddressJson;

            bool isShippingAdded = !string.IsNullOrWhiteSpace(shippingAddress);
            bool isBillingAdded = !string.IsNullOrWhiteSpace(billingAddress);

            return Ok(new
            {
                customerId = customer?.Id ?? 0,
                shippingAddressStatus = isShippingAdded ? "ADDED" : "NOT ADDED",
                billingAddressStatus = isBillingAdded ? "ADDED" : "NOT ADDED",
                shippingAddress = isShippingAdded ? shippingAddress : null,
                billingAddress = isBillingAdded ? billingAddress : null
            });
        }

        // POST/PUT: api/Customer/addresses
        [HttpPost("addresses")]
        [HttpPut("addresses")]
        public async Task<IActionResult> SaveAddresses([FromBody] SaveCustomerAddressesDto dto, [FromQuery] int? customerId)
        {
            Customer? customer = null;
            if (customerId.HasValue && customerId.Value > 0)
            {
                customer = await _context.Customers.FindAsync(customerId.Value);
            }

            if (customer == null)
            {
                customer = await _context.Customers.FirstOrDefaultAsync();
            }

            if (customer == null)
            {
                return NotFound(new { success = false, message = "Customer not found." });
            }

            if (dto != null)
            {
                if (dto.ShippingAddress != null)
                {
                    customer.ShippingAddressJson = System.Text.Json.JsonSerializer.Serialize(dto.ShippingAddress);
                }
                if (dto.BillingAddress != null)
                {
                    customer.BillingAddressJson = System.Text.Json.JsonSerializer.Serialize(dto.BillingAddress);
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Addresses updated successfully.",
                shippingAddressStatus = !string.IsNullOrWhiteSpace(customer.ShippingAddressJson) ? "ADDED" : "NOT ADDED",
                billingAddressStatus = !string.IsNullOrWhiteSpace(customer.BillingAddressJson) ? "ADDED" : "NOT ADDED",
                shippingAddress = customer.ShippingAddressJson,
                billingAddress = customer.BillingAddressJson
            });
        }

        // 5. My Profile -> Bank & Payment Details Tab
        // GET: api/Customer/bank-details
        [HttpGet("bank-details")]
        public async Task<IActionResult> GetBankDetails([FromQuery] int? customerId)
        {
            Customer? customer = null;
            if (customerId.HasValue && customerId.Value > 0)
            {
                customer = await _context.Customers.FindAsync(customerId.Value);
            }

            if (customer == null)
            {
                customer = await _context.Customers.FirstOrDefaultAsync();
            }

            bool isBankConfigured = customer != null && !string.IsNullOrWhiteSpace(customer.AccountNumber);
            bool isUpiConfigured = customer != null && !string.IsNullOrWhiteSpace(customer.UpiId);

            return Ok(new
            {
                customerId = customer?.Id ?? 0,
                bankAccountStatus = isBankConfigured ? "CONFIGURED" : "NOT CONFIGURED",
                upiHandleStatus = isUpiConfigured ? "CONFIGURED" : "NOT CONFIGURED",
                bankAccountInfo = new
                {
                    accountHolderName = customer?.AccountHolderName ?? "",
                    bankName = customer?.BankName ?? "",
                    accountNumber = customer?.AccountNumber ?? "",
                    ifscCode = customer?.IfscCode ?? ""
                },
                upiPaymentHandle = new
                {
                    upiId = customer?.UpiId ?? ""
                }
            });
        }

        // POST/PUT: api/Customer/bank-details
        [HttpPost("bank-details")]
        [HttpPut("bank-details")]
        public async Task<IActionResult> SaveBankDetails([FromBody] SaveBankDetailsDto dto, [FromQuery] int? customerId)
        {
            Customer? customer = null;
            if (customerId.HasValue && customerId.Value > 0)
            {
                customer = await _context.Customers.FindAsync(customerId.Value);
            }

            if (customer == null && User?.Identity?.IsAuthenticated == true && !string.IsNullOrWhiteSpace(User.Identity.Name))
            {
                var ident = User.Identity.Name.Trim().ToLower();
                customer = await _context.Customers.FirstOrDefaultAsync(c => (c.Email != null && c.Email.ToLower() == ident) || c.Phone == ident);
            }

            if (customer == null)
            {
                customer = await _context.Customers.FirstOrDefaultAsync();
            }

            if (customer == null)
            {
                return NotFound(new { success = false, message = "Customer not found." });
            }

            if (dto != null)
            {
                // Server-side regex validations when values are non-empty
                if (!string.IsNullOrWhiteSpace(dto.AccountNumber))
                {
                    var cleanAcc = dto.AccountNumber.Trim();
                    if (!System.Text.RegularExpressions.Regex.IsMatch(cleanAcc, @"^\d{9,18}$"))
                    {
                        return BadRequest(new { success = false, message = "Account Number must be between 9 and 18 numeric digits." });
                    }
                }

                if (!string.IsNullOrWhiteSpace(dto.IfscCode))
                {
                    var cleanIfsc = dto.IfscCode.Trim().ToUpper();
                    if (!System.Text.RegularExpressions.Regex.IsMatch(cleanIfsc, @"^[A-Z]{4}0[A-Z0-9]{6}$"))
                    {
                        return BadRequest(new { success = false, message = "IFSC Code must be 11 alphanumeric characters (e.g. HDFC0001234)." });
                    }
                }

                if (!string.IsNullOrWhiteSpace(dto.UpiId))
                {
                    var cleanUpi = dto.UpiId.Trim();
                    if (!System.Text.RegularExpressions.Regex.IsMatch(cleanUpi, @"^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$"))
                    {
                        return BadRequest(new { success = false, message = "Invalid UPI ID format (e.g. user@upi)." });
                    }
                }

                // Allow overwriting with empty/null to clear fields
                customer.AccountHolderName = dto.AccountHolderName ?? "";
                customer.BankName = dto.BankName ?? "";
                customer.AccountNumber = dto.AccountNumber ?? "";
                customer.IfscCode = dto.IfscCode != null ? dto.IfscCode.ToUpper() : "";
                customer.UpiId = dto.UpiId ?? "";
            }

            await _context.SaveChangesAsync();

            bool isBankConfigured = !string.IsNullOrWhiteSpace(customer.AccountNumber);
            bool isUpiConfigured = !string.IsNullOrWhiteSpace(customer.UpiId);

            return Ok(new
            {
                success = true,
                message = "Bank & Payment details updated successfully.",
                bankAccountStatus = isBankConfigured ? "CONFIGURED" : "NOT CONFIGURED",
                upiHandleStatus = isUpiConfigured ? "CONFIGURED" : "NOT CONFIGURED",
                bankAccountInfo = new
                {
                    accountHolderName = customer.AccountHolderName,
                    bankName = customer.BankName,
                    accountNumber = customer.AccountNumber,
                    ifscCode = customer.IfscCode
                },
                upiPaymentHandle = new
                {
                    upiId = customer.UpiId
                }
            });
        }

        // DELETE: api/Customer/bank-details
        [HttpDelete("bank-details")]
        public async Task<IActionResult> DeleteBankDetails([FromQuery] int? customerId, [FromQuery] string? email)
        {
            Customer? customer = null;
            if (customerId.HasValue && customerId.Value > 0)
            {
                customer = await _context.Customers.FindAsync(customerId.Value);
            }
            else if (!string.IsNullOrWhiteSpace(email))
            {
                var targetEmail = email.Trim().ToLower();
                customer = await _context.Customers.FirstOrDefaultAsync(c => c.Email != null && c.Email.ToLower() == targetEmail);
            }

            if (customer == null && User?.Identity?.IsAuthenticated == true && !string.IsNullOrWhiteSpace(User.Identity.Name))
            {
                var ident = User.Identity.Name.Trim().ToLower();
                customer = await _context.Customers.FirstOrDefaultAsync(c => (c.Email != null && c.Email.ToLower() == ident) || c.Phone == ident);
            }

            if (customer == null)
            {
                customer = await _context.Customers.FirstOrDefaultAsync();
            }

            if (customer == null)
            {
                return NotFound(new { success = false, message = "Customer not found." });
            }

            customer.AccountHolderName = "";
            customer.BankName = "";
            customer.AccountNumber = "";
            customer.IfscCode = "";
            customer.UpiId = "";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Bank details cleared successfully.",
                bankAccountStatus = "NOT CONFIGURED",
                upiHandleStatus = "NOT CONFIGURED",
                bankAccountInfo = new { accountHolderName = "", bankName = "", accountNumber = "", ifscCode = "" },
                upiPaymentHandle = new { upiId = "" }
            });
        }

        // 6. My Orders Screen
        // GET: api/Customer/my-orders
        // GET: api/Customer/orders
        [HttpGet("my-orders")]
        [HttpGet("orders")]
        public async Task<IActionResult> GetMyOrders([FromQuery] int? customerId, [FromQuery] string? email, [FromQuery] string? phone, [FromQuery] string? mobile, [FromQuery] string? status, [FromQuery] string? search)
        {
            var targetPhone = phone ?? mobile;
            Customer? customer = null;
            if (customerId.HasValue && customerId.Value > 0)
            {
                customer = await _context.Customers.FindAsync(customerId.Value);
            }
            else if (!string.IsNullOrWhiteSpace(email))
            {
                customer = await _context.Customers.FirstOrDefaultAsync(c => c.Email != null && c.Email.ToLower() == email.Trim().ToLower());
            }
            else if (!string.IsNullOrWhiteSpace(targetPhone))
            {
                var clean = targetPhone.Trim();
                customer = await _context.Customers.FirstOrDefaultAsync(c => c.Phone != null && c.Phone.Contains(clean));
            }
            else if (User?.Identity?.IsAuthenticated == true && !string.IsNullOrWhiteSpace(User.Identity.Name))
            {
                var ident = User.Identity.Name.Trim().ToLower();
                customer = await _context.Customers.FirstOrDefaultAsync(c => (c.Email != null && c.Email.ToLower() == ident) || c.Phone == ident);
            }

            var query = _context.Orders
                .Include(o => o.Items)
                .AsQueryable();

            if (customer != null)
            {
                query = query.Where(o => o.CustomerId == customer.Id);
            }
            else if (customerId.HasValue && customerId.Value > 0)
            {
                query = query.Where(o => o.CustomerId == customerId.Value);
            }
            else if (!string.IsNullOrWhiteSpace(email))
            {
                var targetEmail = email.Trim().ToLower();
                query = query.Where(o => o.Customer != null && o.Customer.Email != null && o.Customer.Email.ToLower() == targetEmail);
            }
            else if (!string.IsNullOrWhiteSpace(targetPhone))
            {
                var clean = targetPhone.Trim();
                query = query.Where(o => o.Customer != null && o.Customer.Phone != null && o.Customer.Phone.Contains(clean));
            }
            else
            {
                // Strict customer scoping: return empty array if no customer filter provided
                return Ok(new object[0]);
            }

            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All Orders", StringComparison.OrdinalIgnoreCase))
            {
                var targetStatus = status.Trim();
                query = query.Where(o => EF.Functions.Like(o.Status, $"%{targetStatus}%"));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(o => o.OrderNumber.ToLower().Contains(term) ||
                                         o.Items.Any(i => i.ProductName.ToLower().Contains(term)));
            }

            var ordersList = await query.OrderByDescending(o => o.OrderDate).ToListAsync();

            var result = ordersList.Select(o =>
            {
                var firstItem = o.Items.FirstOrDefault();
                var itemSummary = firstItem != null ? new
                {
                    productName = firstItem.ProductName,
                    sku = !string.IsNullOrWhiteSpace(firstItem.ProductCode) ? firstItem.ProductCode : $"SKU-{firstItem.ProductId}",
                    quantity = firstItem.Quantity,
                    price = firstItem.Price,
                    priceFormatted = $"${firstItem.Price:F2}",
                    imageUrl = string.IsNullOrWhiteSpace(firstItem.ImageUrl) 
                        ? "https://wildlife-unwieldy-devotee.ngrok-free.dev/images/placeholder.png" 
                        : firstItem.ImageUrl
                } : null;

                var displayStatus = (o.Status ?? "PENDING").ToUpper();

                return new
                {
                    id = o.Id,
                    orderNumber = string.IsNullOrWhiteSpace(o.OrderNumber) ? $"Order #{o.Id}" : o.OrderNumber,
                    orderDate = o.OrderDate,
                    orderDateFormatted = o.OrderDate.ToString("MMM dd, yyyy"),
                    status = displayStatus,
                    fulfillment = displayStatus,
                    statusBadge = displayStatus,
                    paymentStatus = o.PaymentStatus ?? "Pending",
                    paymentMethod = o.PaymentMethod ?? "COD",
                    totalAmount = o.TotalAmount > 0 ? o.TotalAmount : o.FinalAmount,
                    totalAmountFormatted = $"${(o.TotalAmount > 0 ? o.TotalAmount : o.FinalAmount):F2}",
                    totalQuantity = o.Items.Sum(i => i.Quantity),
                    shippingAddress = o.ShippingAddress ?? "",
                    billingAddress = customer?.BillingAddressJson ?? o.ShippingAddress ?? "",
                    itemSummary = itemSummary,
                    items = o.Items.Select(i => new
                    {
                        id = i.Id,
                        productId = i.ProductId,
                        productName = i.ProductName,
                        sku = !string.IsNullOrWhiteSpace(i.ProductCode) ? i.ProductCode : $"SKU-{i.ProductId}",
                        productCode = i.ProductCode,
                        categoryName = i.CategoryName,
                        quantity = i.Quantity,
                        price = i.Price,
                        subtotal = i.Subtotal,
                        imageUrl = string.IsNullOrWhiteSpace(i.ImageUrl)
                            ? "https://wildlife-unwieldy-devotee.ngrok-free.dev/images/placeholder.png"
                            : i.ImageUrl
                    })
                };
            });

            return Ok(result);
        }

        // 7. Order Details Endpoint
        // GET: api/Customer/order-details/1
        // GET: api/Customer/orders/1
        [HttpGet("order-details/{orderId}")]
        [HttpGet("orders/{orderId}")]
        public async Task<IActionResult> GetOrderDetails(string orderId)
        {
            var cleanNum = NormalizeOrderNumber(orderId);
            Order? order = null;

            if (int.TryParse(cleanNum, out int id))
            {
                order = await _context.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);
            }

            if (order == null)
            {
                order = await _context.Orders.Include(o => o.Items)
                    .FirstOrDefaultAsync(o => o.OrderNumber.ToLower() == orderId.Trim().ToLower() ||
                                              o.OrderNumber.ToLower().Replace("#", "").Replace("ord-", "").Trim() == cleanNum);
            }

            if (order == null)
            {
                return NotFound(new { success = false, message = $"Order '{orderId}' not found." });
            }

            var customer = await _context.Customers.FindAsync(order.CustomerId);
            var displayStatus = (order.Status ?? "PENDING").ToUpper();

            return Ok(new
            {
                id = order.Id,
                orderNumber = string.IsNullOrWhiteSpace(order.OrderNumber) ? $"ORD-{order.Id:D6}" : order.OrderNumber,
                orderDate = order.OrderDate,
                orderDateFormatted = order.OrderDate.ToString("MMM dd, yyyy"),
                status = displayStatus,
                fulfillment = displayStatus,
                statusBadge = displayStatus,
                paymentStatus = order.PaymentStatus ?? "Pending",
                paymentMethod = order.PaymentMethod ?? "COD",
                totalAmount = order.TotalAmount > 0 ? order.TotalAmount : order.FinalAmount,
                totalAmountFormatted = $"${(order.TotalAmount > 0 ? order.TotalAmount : order.FinalAmount):F2}",
                shippingAddress = order.ShippingAddress ?? "",
                billingAddress = customer?.BillingAddressJson ?? order.ShippingAddress ?? "",
                trackingNumber = order.TrackingNumber ?? "",
                carrierName = order.CarrierName ?? "",
                items = order.Items.Select(i => new
                {
                    id = i.Id,
                    productId = i.ProductId,
                    productName = i.ProductName,
                    sku = !string.IsNullOrWhiteSpace(i.ProductCode) ? i.ProductCode : $"SKU-{i.ProductId}",
                    productCode = i.ProductCode,
                    categoryName = i.CategoryName,
                    quantity = i.Quantity,
                    price = i.Price,
                    subtotal = i.Subtotal,
                    imageUrl = string.IsNullOrWhiteSpace(i.ImageUrl)
                        ? "https://wildlife-unwieldy-devotee.ngrok-free.dev/images/placeholder.png"
                        : i.ImageUrl
                })
            });
        }

        // Helper to strip prefixes (matches 211406, #211406, ORD-211406, #ORD-211406)
        private static string NormalizeOrderNumber(string? input)
        {
            if (string.IsNullOrWhiteSpace(input)) return "";
            return input.Replace("#", "").Replace("ORD-", "").Replace("ord-", "").Trim().ToLower();
        }

        // 8. Track Your Order Screen
        // GET: api/Customer/track-order
        // POST: api/Customer/track-order
        // GET: api/Customer/track
        [HttpGet("track-order")]
        [HttpPost("track-order")]
        [HttpGet("track")]
        public async Task<IActionResult> TrackOrder([FromQuery] string? orderNumber, [FromQuery] string? emailOrMobile, [FromBody] TrackOrderRequestDto? bodyDto)
        {
            var rawSearch = orderNumber ?? bodyDto?.OrderNumber ?? bodyDto?.OrderId;

            if (string.IsNullOrWhiteSpace(rawSearch))
            {
                return Ok(new
                {
                    found = false,
                    message = "Please enter a valid Order Number (e.g., 211406, #211406, or ORD-211406).",
                    timeline = new object[0]
                });
            }

            var cleanNum = NormalizeOrderNumber(rawSearch);
            Order? order = null;

            if (int.TryParse(cleanNum, out int numericId))
            {
                order = await _context.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == numericId);
            }

            if (order == null)
            {
                order = await _context.Orders.Include(o => o.Items)
                    .FirstOrDefaultAsync(o => o.OrderNumber.ToLower() == rawSearch.Trim().ToLower() ||
                                              o.OrderNumber.ToLower().Replace("#", "").Replace("ord-", "").Trim() == cleanNum);
            }

            if (order == null)
            {
                return Ok(new
                {
                    found = false,
                    orderNumber = rawSearch,
                    message = $"Order '{rawSearch}' was not found.",
                    timeline = new object[0]
                });
            }

            string statusStr = order.Status ?? "PENDING";
            string statusUpper = statusStr.ToUpper();

            string carrier = !string.IsNullOrWhiteSpace(order.CarrierName) ? order.CarrierName : "BlueDart Express";
            string tracking = !string.IsNullOrWhiteSpace(order.TrackingNumber) ? order.TrackingNumber : $"AWB-{order.Id:D8}";
            string estDelivery = order.OrderDate.AddDays(3).ToString("yyyy-MM-ddTHH:mm:ssZ");

            bool isPlaced = true;
            bool isProcessing = statusUpper == "PROCESSING" || statusUpper == "SHIPPED" || statusUpper == "DELIVERED";
            bool isShipped = statusUpper == "SHIPPED" || statusUpper == "DELIVERED";
            bool isOutForDelivery = statusUpper == "OUT FOR DELIVERY" || statusUpper == "DELIVERED";
            bool isDelivered = statusUpper == "DELIVERED";

            var timeline = new object[]
            {
                new { step = 1, title = "Order Placed", description = "Order confirmed", isCompleted = isPlaced, timestamp = order.OrderDate.ToString("yyyy-MM-ddTHH:mm:ssZ") },
                new { step = 2, title = "Processing", description = "Packed at warehouse", isCompleted = isProcessing, isCurrent = statusUpper == "PROCESSING", timestamp = isProcessing ? order.OrderDate.AddDays(1).ToString("yyyy-MM-ddTHH:mm:ssZ") : null },
                new { step = 3, title = "Shipped", description = "In transit with courier", isCompleted = isShipped, isCurrent = statusUpper == "SHIPPED", timestamp = isShipped ? order.OrderDate.AddDays(2).ToString("yyyy-MM-ddTHH:mm:ssZ") : null },
                new { step = 4, title = "Out for Delivery", description = "Courier out for delivery", isCompleted = isOutForDelivery, isCurrent = statusUpper == "OUT FOR DELIVERY", timestamp = isOutForDelivery ? order.OrderDate.AddDays(3).ToString("yyyy-MM-ddTHH:mm:ssZ") : null },
                new { step = 5, title = "Delivered", description = "Delivered to customer", isCompleted = isDelivered, isCurrent = statusUpper == "DELIVERED", timestamp = isDelivered ? order.OrderDate.AddDays(3).ToString("yyyy-MM-ddTHH:mm:ssZ") : null }
            };

            var orderNumDisplay = string.IsNullOrWhiteSpace(order.OrderNumber) ? $"ORD-{order.Id:D6}" : order.OrderNumber;

            return Ok(new
            {
                found = true,
                orderNumber = orderNumDisplay,
                carrierName = carrier,
                trackingNumber = tracking,
                currentStatus = statusUpper,
                statusBadge = statusUpper.Equals("DELIVERED", StringComparison.OrdinalIgnoreCase) ? "Delivered" :
                             statusUpper.Equals("SHIPPED", StringComparison.OrdinalIgnoreCase) ? "Shipped" :
                             statusUpper.Equals("PROCESSING", StringComparison.OrdinalIgnoreCase) ? "Processing" : "Order Placed",
                estimatedDelivery = estDelivery,
                timeline = timeline
            });
        }

        // 9. Customer Logout
        // POST: api/Customer/logout
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            return Ok(new
            {
                success = true,
                message = "Logged out successfully. Please clear authentication tokens from client storage."
            });
        }

        // 10. Customer Change Password
        // POST: api/Customer/change-password
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.NewPassword))
            {
                return BadRequest(new { success = false, message = "New password is required." });
            }

            if (!string.IsNullOrWhiteSpace(dto.ConfirmPassword) && dto.NewPassword != dto.ConfirmPassword)
            {
                return BadRequest(new { success = false, message = "New password and Confirm password do not match." });
            }

            Customer? customer = null;
            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var identifier = dto.Email.Trim().ToLower();
                customer = await _context.Customers
                    .FirstOrDefaultAsync(c => (c.Email != null && c.Email.ToLower() == identifier) || c.Phone == identifier);
            }

            if (customer == null && User?.Identity?.IsAuthenticated == true && !string.IsNullOrWhiteSpace(User.Identity.Name))
            {
                var ident = User.Identity.Name.Trim().ToLower();
                customer = await _context.Customers.FirstOrDefaultAsync(c => (c.Email != null && c.Email.ToLower() == ident) || c.Phone == ident);
            }

            if (customer == null)
            {
                customer = await _context.Customers.FirstOrDefaultAsync();
            }

            if (customer == null)
            {
                return NotFound(new { success = false, message = "Customer not found." });
            }

            var oldPass = dto.OldPassword ?? dto.CurrentPassword;
            if (!string.IsNullOrWhiteSpace(oldPass) && !string.IsNullOrWhiteSpace(customer.Password))
            {
                if (customer.Password != oldPass)
                {
                    return BadRequest(new { success = false, message = "Current password is incorrect." });
                }
            }

            customer.Password = dto.NewPassword;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Password updated successfully."
            });
        }
    }

    public class TrackOrderRequestDto
    {
        public string? OrderNumber { get; set; }
        public string? OrderId { get; set; }
        public string? EmailOrMobileNumber { get; set; }
        public string? Email { get; set; }
    }

    public class CustomerLoginDto
    {
        public string EmailOrPhone { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class CustomerRegisterDto
    {
        public string FullName { get; set; } = string.Empty;
        public string EmailOrPhone { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string Password { get; set; } = string.Empty;
        public string? Gender { get; set; }
        public string? CompanyOrganization { get; set; }
    }

    public class UpdateCustomerProfileDto
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? EmailAddress { get; set; }
        public string? MobileNumber { get; set; }
        public string? Gender { get; set; }
        public string? CompanyOrganization { get; set; }
    }

    public class SaveCustomerAddressesDto
    {
        public object? ShippingAddress { get; set; }
        public object? BillingAddress { get; set; }
    }

    public class SaveBankDetailsDto
    {
        public string? AccountHolderName { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public string? IfscCode { get; set; }
        public string? UpiId { get; set; }
    }
}
