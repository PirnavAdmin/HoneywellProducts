using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Honeywell.Data;
using Honeywell.Models;
using Honeywell.DTOs;
using Honeywell.Services.Interfaces;
using Honeywell.Helpers;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using System.Security.Cryptography;
using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Honeywell.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ICashfreeService _cashfreeService;
        private readonly ILogger<PaymentController> _logger;

        public PaymentController(
            ApplicationDbContext context,
            ICashfreeService cashfreeService,
            ILogger<PaymentController> logger)
        {
            _context = context;
            _cashfreeService = cashfreeService;
            _logger = logger;
        }

        private bool IsAdminUser()
        {
            if (User?.Identity?.IsAuthenticated == true)
            {
                var role = User.FindFirst(ClaimTypes.Role)?.Value ?? User.FindFirst("role")?.Value ?? "";
                if (role.Equals("Admin", StringComparison.OrdinalIgnoreCase) ||
                    role.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase) ||
                    role.Equals("Manager", StringComparison.OrdinalIgnoreCase) ||
                    role.Equals("Staff", StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }
            return false;
        }

        private bool ValidateOrderOwnership(Order order, string? customerEmail, string? customerPhone, string? guestToken = null)
        {
            if (IsAdminUser()) return true;

            if (User?.Identity?.IsAuthenticated == true)
            {
                var authCustId = User.FindFirst("customerId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var authEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value ?? User.Identity?.Name;

                if (!string.IsNullOrEmpty(authCustId) && order.CustomerId.ToString() == authCustId)
                {
                    return true;
                }

                if (!string.IsNullOrEmpty(authEmail) && order.Customer != null &&
                    !string.IsNullOrEmpty(order.Customer.Email) &&
                    order.Customer.Email.Equals(authEmail, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }

                return false;
            }

            // For unauthenticated / guest orders:
            // Customer email and phone alone CANNOT authorize access to an order.
            // Require the server-issued cryptographic GuestToken.
            var tokenCandidate = !string.IsNullOrWhiteSpace(guestToken)
                ? guestToken.Trim()
                : (Request?.Headers["x-guest-token"].ToString()?.Trim() ?? Request?.Query["guestToken"].ToString()?.Trim());

            if (!string.IsNullOrWhiteSpace(tokenCandidate) && !string.IsNullOrWhiteSpace(order.GuestToken))
            {
                var suppliedBytes = Encoding.UTF8.GetBytes(tokenCandidate);
                var orderTokenBytes = Encoding.UTF8.GetBytes(order.GuestToken.Trim());
                if (suppliedBytes.Length == orderTokenBytes.Length &&
                    CryptographicOperations.FixedTimeEquals(suppliedBytes, orderTokenBytes))
                {
                    return true;
                }
            }

            return false;
        }

        /// <summary>
        /// Creates a Cashfree Sandbox payment order session for an existing, unpaid application order.
        /// </summary>
        [HttpPost("cashfree/create-order")]
        public async Task<IActionResult> CreateCashfreeOrder([FromBody] CreateCashfreePaymentOrderRequest request)
        {
            var orderRef = !string.IsNullOrWhiteSpace(request?.OrderId)
                ? request.OrderId.Trim()
                : request?.InvoiceId?.Trim();

            if (string.IsNullOrWhiteSpace(orderRef))
            {
                return BadRequest(new CashfreeOrderCreationResponse
                {
                    Success = false,
                    Message = "OrderId or InvoiceId is required."
                });
            }

            // Check if price visibility / online ordering is allowed
            var isPriceVisibilityEnabled = await Honeywell.Helpers.PriceVisibilityHelper.IsPriceVisibilityEnabledAsync(_context);
            if (!isPriceVisibilityEnabled)
            {
                return BadRequest(new CashfreeOrderCreationResponse
                {
                    Success = false,
                    Message = "Online payments are currently disabled. Please submit an enquiry or request a quote."
                });
            }

            // Find order in database by Id, OrderNumber, or InvoiceId
            Order? order = null;
            if (int.TryParse(orderRef, out int numericOrderId))
            {
                order = await _context.Orders
                    .Include(o => o.Customer)
                    .Include(o => o.Items)
                    .FirstOrDefaultAsync(o => o.Id == numericOrderId);
            }

            if (order == null)
            {
                order = await _context.Orders
                    .Include(o => o.Customer)
                    .Include(o => o.Items)
                    .FirstOrDefaultAsync(o => o.OrderNumber == orderRef);
            }

            if (order == null && orderRef.StartsWith("INV-", StringComparison.OrdinalIgnoreCase))
            {
                var ordNumberEquivalent = "ORD-" + orderRef[4..];
                var rawSuffix = orderRef[4..];
                order = await _context.Orders
                    .Include(o => o.Customer)
                    .Include(o => o.Items)
                    .FirstOrDefaultAsync(o => o.OrderNumber == ordNumberEquivalent || o.OrderNumber == rawSuffix);

                if (order == null && int.TryParse(rawSuffix, out int invoiceNumId))
                {
                    order = await _context.Orders
                        .Include(o => o.Customer)
                        .Include(o => o.Items)
                        .FirstOrDefaultAsync(o => o.Id == invoiceNumId);
                }
            }

            if (order == null)
            {
                return NotFound(new CashfreeOrderCreationResponse
                {
                    Success = false,
                    Message = $"Application order or invoice '{orderRef}' was not found in the database."
                });
            }

            // Ensure verified database amount
            if (order.FinalAmount <= 0)
            {
                decimal sub = order.TotalAmount > 0 ? order.TotalAmount : (order.Items?.Sum(i => i.Subtotal) ?? 0);
                decimal tax = order.GstAmount > 0 ? order.GstAmount : Math.Round(sub * 0.18m, 2);
                order.GstAmount = tax;
                order.FinalAmount = sub + order.ShippingFee + tax - order.DiscountAmount;
            }

            // Ensure order has server-issued guest token
            if (string.IsNullOrWhiteSpace(order.GuestToken))
            {
                order.GuestToken = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
                await _context.SaveChangesAsync();
            }

            // Check order ownership / authorization
            if (!ValidateOrderOwnership(order, request.CustomerEmail, request.CustomerPhone, request.GuestToken))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new CashfreeOrderCreationResponse
                {
                    Success = false,
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    Message = "Access denied: Valid authentication or guest checkout authorization token required."
                });
            }

            // Reject cancelled orders
            if (order.Status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase) ||
                order.Status.Equals("Canceled", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new CashfreeOrderCreationResponse
                {
                    Success = false,
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    Message = "Cannot initiate payment for a cancelled order."
                });
            }

            // Reject already-paid orders
            if (order.PaymentStatus.Equals("Paid", StringComparison.OrdinalIgnoreCase) ||
                order.PaymentStatus.Equals("Success", StringComparison.OrdinalIgnoreCase) ||
                order.PaymentStatus.Equals("Verified Paid", StringComparison.OrdinalIgnoreCase) ||
                order.PaymentStatus.Equals("Verified", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new CashfreeOrderCreationResponse
                {
                    Success = false,
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    Message = "This order has already been paid successfully."
                });
            }

            // Check if gateway credentials are setup
            if (!_cashfreeService.IsConfigured())
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new CashfreeOrderCreationResponse
                {
                    Success = false,
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    Message = "Cashfree payment gateway credentials are not configured on the server. Please configure CASHFREE_APP_ID and CASHFREE_SECRET_KEY."
                });
            }

            // Initiate payment with trusted database amount
            var response = await _cashfreeService.CreatePaymentOrderAsync(
                order,
                request.ReturnUrl,
                request.NotifyUrl,
                request.IdempotencyKey);

            if (response.Success)
            {
                response.GuestToken = order.GuestToken;
                return Ok(response);
            }

            return BadRequest(response);
        }

        /// <summary>
        /// Retrieves the latest payment transaction and session status for an application order.
        /// </summary>
        [HttpGet("cashfree/order/{orderRef}")]
        public async Task<IActionResult> GetCashfreeOrderDetails(string orderRef)
        {
            if (string.IsNullOrWhiteSpace(orderRef))
            {
                return BadRequest(new { Success = false, Message = "Order reference is required." });
            }

            var cleanRef = orderRef.Trim();
            var tx = await _context.PaymentTransactions
                .Where(t => t.Gateway == "Cashfree" && (t.OrderNumber == cleanRef || t.CfOrderId == cleanRef || t.OrderId.ToString() == cleanRef))
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();

            if (tx == null)
            {
                return NotFound(new { Success = false, Message = $"No payment transaction found for '{orderRef}'." });
            }

            var order = await _context.Orders
                .Include(o => o.Customer)
                .FirstOrDefaultAsync(o => o.Id == tx.OrderId);

            if (order != null && !ValidateOrderOwnership(order, null, null))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    Success = false,
                    Message = "Access denied: You are not authorized to view this transaction."
                });
            }

            return Ok(new
            {
                Success = true,
                OrderId = tx.OrderId,
                OrderNumber = tx.OrderNumber,
                CfOrderId = tx.CfOrderId,
                PaymentSessionId = tx.PaymentSessionId,
                Amount = tx.Amount,
                Currency = tx.Currency,
                Status = tx.Status,
                Gateway = tx.Gateway,
                CreatedAt = tx.CreatedAt,
                UpdatedAt = tx.UpdatedAt
            });
        }

        /// <summary>
        /// Authoritatively verifies and reconciles Cashfree payment status with Cashfree PG Sandbox APIs.
        /// </summary>
        [HttpGet("cashfree/verify/{orderRef}")]
        public async Task<IActionResult> VerifyCashfreeOrderPayment(
            string orderRef,
            [FromQuery] string? customerEmail = null,
            [FromQuery] string? customerPhone = null,
            [FromQuery] string? guestToken = null)
        {
            if (string.IsNullOrWhiteSpace(orderRef))
            {
                return BadRequest(new { Success = false, Message = "Order reference is required." });
            }

            var cleanRef = orderRef.Trim();
            var tx = await _context.PaymentTransactions
                .Where(t => t.Gateway == "Cashfree" && (t.OrderNumber == cleanRef || t.CfOrderId == cleanRef || t.OrderId.ToString() == cleanRef))
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();

            if (tx == null)
            {
                return NotFound(new { Success = false, Message = $"No payment transaction found for '{orderRef}'." });
            }

            var order = await _context.Orders
                .Include(o => o.Customer)
                .FirstOrDefaultAsync(o => o.Id == tx.OrderId);

            if (order != null && !ValidateOrderOwnership(order, customerEmail, customerPhone, guestToken))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    Success = false,
                    Message = "Access denied: You are not authorized to view or verify this transaction."
                });
            }

            var result = await _cashfreeService.VerifyAndReconcileOrderPaymentAsync(orderRef);
                        return Ok(result);
        }

        /// <summary>
        /// Official Cashfree webhook endpoint (POST /api/Payment/cashfree-webhook).
        /// Validates HMAC-SHA256 signature using timing-safe comparison, handles idempotency,
        /// and reconciles application order payment state.
        /// </summary>
        [HttpPost("cashfree-webhook")]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        public async Task<IActionResult> HandleCashfreeWebhook()
        {
            Request.EnableBuffering();

            string rawBody;
            using (var reader = new StreamReader(Request.Body, Encoding.UTF8, leaveOpen: true))
            {
                rawBody = await reader.ReadToEndAsync();
                Request.Body.Position = 0;
            }

            var signature = Request.Headers["x-webhook-signature"].ToString();
            var timestamp = Request.Headers["x-webhook-timestamp"].ToString();

            if (string.IsNullOrWhiteSpace(rawBody) ||
                string.IsNullOrWhiteSpace(signature) ||
                string.IsNullOrWhiteSpace(timestamp))
            {
                _logger.LogWarning("Cashfree Webhook rejected: Missing body or signature/timestamp headers.");
                return BadRequest(new { Message = "Missing required signature headers or payload." });
            }

            var processResult = await _cashfreeService.ProcessWebhookAsync(rawBody, timestamp, signature);

            return StatusCode(processResult.StatusCode, new
            {
                Success = processResult.Success,
                Message = processResult.Message
            });
        }

        public class InitiatePaymentRequest
        {
            public string PaymentMethod { get; set; } // UPI, DebitCard, CreditCard, NetBanking, QRPayment, COD
            public decimal Amount { get; set; }
            public string? OrderId { get; set; }
            public string? UpiId { get; set; }
            public string? CardNumber { get; set; }
            public string? NameOnCard { get; set; }
            public string? ExpiryDate { get; set; }
            public string? Cvv { get; set; }
            public string? BankName { get; set; }
        }

        public class NetBankingLoginRequest
        {
            public string TransactionId { get; set; }
            public string Username { get; set; }
            public string Password { get; set; }
        }

        public class NetBankingOtpRequest
        {
            public string TransactionId { get; set; }
            public string Otp { get; set; }
        }

        public class CompletePaymentRequest
        {
            public string TransactionId { get; set; }
        }

        [HttpPost("initiate")]
        public async Task<IActionResult> InitiatePayment([FromBody] InitiatePaymentRequest request)
        {
            var isPriceVisibilityEnabled = await Honeywell.Helpers.PriceVisibilityHelper.IsPriceVisibilityEnabledAsync(_context);
            if (!isPriceVisibilityEnabled)
            {
                return BadRequest(new { Success = false, Message = "Online payments are currently disabled. Please submit an enquiry or request a quote." });
            }

            if (string.IsNullOrEmpty(request.PaymentMethod))
            {
                return BadRequest(new { Success = false, Message = "PaymentMethod is required." });
            }

            string transactionId = "TXN" + DateTime.UtcNow.ToString("yyyyMMdd") + new Random().Next(100000, 999999).ToString();

            Order? dbOrder = null;
            if (!string.IsNullOrEmpty(request.OrderId))
            {
                if (int.TryParse(request.OrderId, out int numericId))
                {
                    dbOrder = await _context.Orders.FirstOrDefaultAsync(o => o.Id == numericId);
                }
                if (dbOrder == null)
                {
                    dbOrder = await _context.Orders.FirstOrDefaultAsync(o => o.OrderNumber == request.OrderId);
                }
            }

            decimal finalAmount = request.Amount;
            string resolvedOrderId = request.OrderId ?? "";
            if (dbOrder != null)
            {
                finalAmount = dbOrder.FinalAmount;
                resolvedOrderId = dbOrder.OrderNumber;
            }

            if (finalAmount == 0.0m)
            {
                finalAmount = 2183.0m;
            }

            OrderSuccess? orderSuccess = null;
            if (dbOrder != null)
            {
                orderSuccess = await _context.OrderSuccesses.FirstOrDefaultAsync(o => o.OrderId == dbOrder.Id.ToString() || o.OrderId == dbOrder.OrderNumber);
                if (orderSuccess != null)
                {
                    orderSuccess.TransactionId = transactionId;
                    orderSuccess.PaymentStatus = "Pending";
                    orderSuccess.OrderStatus = "PendingPayment";
                    await _context.SaveChangesAsync();
                }
            }

            // Retrieve UPI Details from DB or Fallback
            var upiConfig = await _context.UpiDetailsConfigs.FirstOrDefaultAsync();
            string merchantUpi = upiConfig?.MerchantUpiId ?? "honeywell@hdfcbank";
            string merchantName = upiConfig?.MerchantName ?? "Honeywell Products India";
            string bankDisplayName = upiConfig?.BankDisplayName ?? "HDFC Bank - Corporate";
            string currency = upiConfig?.Currency ?? "INR";

            string note = "Order Payment";
            string upiLink = $"upi://pay?pa={merchantUpi}&pn={Uri.EscapeDataString(merchantName)}&am={finalAmount}&cu={currency}&tn={Uri.EscapeDataString(note)}&tr={transactionId}";

            // Retrieve QR Image settings
            var qrConfig = await _context.QrCodeConfigs.FirstOrDefaultAsync();
            string qrImageUrl = "";
            if (qrConfig != null && !string.IsNullOrEmpty(qrConfig.QrImageUrl))
            {
                qrImageUrl = qrConfig.QrImageUrl;
                if (qrImageUrl.StartsWith("/"))
                {
                    var httpReq = HttpContext.Request;
                    qrImageUrl = $"{httpReq.Scheme}://{httpReq.Host}{qrImageUrl}";
                }
            }
            else
            {
                qrImageUrl = $"https://api.qrserver.com/v1/create-qr-code/?size=250x250&data={Uri.EscapeDataString(upiLink)}";
            }

            if (request.PaymentMethod.Equals("NetBanking", StringComparison.OrdinalIgnoreCase))
            {
                if (string.IsNullOrEmpty(request.BankName))
                {
                    return BadRequest(new { Success = false, Message = "BankName is required for Net Banking payment." });
                }

                if (orderSuccess != null)
                {
                    orderSuccess.PaymentStatus = "Pending";
                    orderSuccess.OrderStatus = "PendingPayment";
                    await _context.SaveChangesAsync();
                }

                return Ok(new
                {
                    success = true,
                    transactionId = transactionId,
                    orderId = resolvedOrderId,
                    merchantName = merchantName,
                    merchantUpiId = merchantUpi,
                    bankDisplayName = bankDisplayName,
                    amount = finalAmount,
                    currency = currency,
                    upiDeepLink = upiLink,
                    qrPayload = upiLink,
                    paymentStatus = "Pending",
                    message = "Redirecting to Net Banking gateway..."
                });
            }

            if (request.PaymentMethod.Equals("UPI", StringComparison.OrdinalIgnoreCase) || 
                request.PaymentMethod.Equals("QRPayment", StringComparison.OrdinalIgnoreCase))
            {
                if (orderSuccess != null)
                {
                    orderSuccess.PaymentStatus = "Pending";
                    orderSuccess.OrderStatus = "PendingPayment";
                    if (!string.IsNullOrEmpty(request.UpiId))
                    {
                        orderSuccess.UpiId = request.UpiId;
                    }
                    await _context.SaveChangesAsync();
                }

                return Ok(new
                {
                    transactionId = transactionId,
                    orderId = resolvedOrderId,
                    amount = finalAmount,
                    merchantName = merchantName,
                    merchantUpiId = merchantUpi,
                    bankDisplayName = bankDisplayName,
                    currency = currency,
                    upiDeepLink = upiLink,
                    qrPayload = upiLink,
                    qrImageUrl = qrImageUrl,
                    paymentStatus = "Pending"
                });
            }

            if (request.PaymentMethod.Equals("DebitCard", StringComparison.OrdinalIgnoreCase) ||
                request.PaymentMethod.Equals("CreditCard", StringComparison.OrdinalIgnoreCase))
            {
                if (string.IsNullOrEmpty(request.CardNumber) || request.CardNumber.Replace(" ", "").Length < 16)
                {
                    return BadRequest(new { Success = false, Message = "A valid 16-digit Card Number is required." });
                }
                if (string.IsNullOrEmpty(request.ExpiryDate) || !request.ExpiryDate.Contains("/"))
                {
                    return BadRequest(new { Success = false, Message = "A valid Expiry Date (MM/YY) is required." });
                }
                if (string.IsNullOrEmpty(request.Cvv) || request.Cvv.Length < 3)
                {
                    return BadRequest(new { Success = false, Message = "A valid 3-digit CVV is required." });
                }

                if (orderSuccess != null)
                {
                    orderSuccess.PaymentStatus = "Success";
                    orderSuccess.OrderStatus = "Placed";
                    string cleaned = request.CardNumber.Replace(" ", "");
                    orderSuccess.CardNumber = "**** **** **** " + cleaned.Substring(cleaned.Length - 4);
                    orderSuccess.NameOnCard = request.NameOnCard;
                    orderSuccess.ExpiryDate = request.ExpiryDate;
                    await _context.SaveChangesAsync();
                }

                return Ok(new
                {
                    success = true,
                    transactionId = transactionId,
                    orderId = resolvedOrderId,
                    merchantName = merchantName,
                    merchantUpiId = merchantUpi,
                    bankDisplayName = bankDisplayName,
                    amount = finalAmount,
                    currency = currency,
                    upiDeepLink = upiLink,
                    qrPayload = upiLink,
                    paymentStatus = "Success",
                    message = $"{request.PaymentMethod} Payment authorized successfully."
                });
            }

            if (orderSuccess != null)
            {
                orderSuccess.PaymentStatus = "Success";
                orderSuccess.OrderStatus = "Placed";
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                success = true,
                transactionId = transactionId,
                orderId = resolvedOrderId,
                merchantName = merchantName,
                merchantUpiId = merchantUpi,
                bankDisplayName = bankDisplayName,
                amount = finalAmount,
                currency = currency,
                upiDeepLink = upiLink,
                qrPayload = upiLink,
                paymentStatus = "Success",
                message = "Order processed under Cash on Delivery."
            });
        }

        [HttpPost("netbanking/login")]
        public async Task<IActionResult> NetBankingLogin([FromBody] NetBankingLoginRequest request)
        {
            var order = await _context.OrderSuccesses.FirstOrDefaultAsync(o => o.TransactionId == request.TransactionId);
            if (order == null)
            {
                return NotFound(new { Success = false, Message = "Transaction not found." });
            }

            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { Success = false, Message = "Username and password are required." });
            }

            return Ok(new
            {
                Success = true,
                TransactionId = request.TransactionId,
                Message = "Secure Login Success. OTP sent to your registered mobile number.",
                Otp = "123456"
            });
        }

        [HttpPost("netbanking/verify-otp")]
        public async Task<IActionResult> NetBankingVerifyOtp([FromBody] NetBankingOtpRequest request)
        {
            var order = await _context.OrderSuccesses.FirstOrDefaultAsync(o => o.TransactionId == request.TransactionId);
            if (order == null)
            {
                return NotFound(new { Success = false, Message = "Transaction not found." });
            }

            if (request.Otp != "123456")
            {
                return BadRequest(new { Success = false, Message = "Invalid or expired OTP." });
            }

            order.PaymentStatus = "Success";
            order.OrderStatus = "Placed";
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Success = true,
                TransactionId = request.TransactionId,
                Status = "Success",
                Message = "Net Banking Payment successful."
            });
        }

        [HttpPost("card/verify-otp")]
        public async Task<IActionResult> CardVerifyOtp([FromBody] NetBankingOtpRequest request)
        {
            var order = await _context.OrderSuccesses.FirstOrDefaultAsync(o => o.TransactionId == request.TransactionId);
            if (order == null)
            {
                return NotFound(new { Success = false, Message = "Transaction not found." });
            }

            if (request.Otp != "123456" && request.Otp != "000000")
            {
                return BadRequest(new { Success = false, Message = "Invalid or expired OTP." });
            }

            order.PaymentStatus = "Success";
            order.OrderStatus = "Placed";
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Success = true,
                TransactionId = request.TransactionId,
                Status = "Success",
                Message = "Card Payment authorized successfully."
            });
        }

        [HttpGet("status/{transactionId}")]
        public async Task<IActionResult> GetPaymentStatus(string transactionId)
        {
            var order = await _context.OrderSuccesses.FirstOrDefaultAsync(x => x.TransactionId == transactionId);
            if (order != null)
            {
                return Ok(new
                {
                    TransactionId = order.TransactionId,
                    OrderId = order.OrderId,
                    PaymentMethod = order.PaymentMethod,
                    PaymentStatus = order.PaymentStatus,
                    OrderStatus = order.OrderStatus
                });
            }

            var manual = await _context.ManualPayments.FirstOrDefaultAsync(m => m.UtrNumber == transactionId || m.OrderId == transactionId);
            if (manual != null)
            {
                string status = manual.VerificationStatus;
                string mappedStatus = "Pending";
                if (status == "Approved") mappedStatus = "Success";
                if (status == "Rejected") mappedStatus = "Failed";

                return Ok(new
                {
                    TransactionId = manual.UtrNumber,
                    OrderId = manual.OrderId,
                    PaymentMethod = "Manual",
                    PaymentStatus = mappedStatus,
                    OrderStatus = mappedStatus == "Success" ? "Placed" : "PendingVerification"
                });
            }

            return NotFound(new { Success = false, Message = "Transaction not found." });
        }

        [HttpPost("complete")]
        public async Task<IActionResult> CompletePayment([FromBody] CompletePaymentRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.TransactionId))
            {
                return BadRequest(new { Success = false, Message = "TransactionId is required." });
            }

            // Security: Cashfree transactions cannot be marked as Success merely based on client request
            var tx = await _context.PaymentTransactions
                .Where(t => t.Gateway == "Cashfree" && (t.CfOrderId == request.TransactionId || t.PaymentSessionId == request.TransactionId || t.OrderNumber == request.TransactionId))
                .FirstOrDefaultAsync();

            if (tx != null)
            {
                return BadRequest(new
                {
                    Success = false,
                    Message = "Cashfree transactions require authoritative server-side or webhook verification."
                });
            }

            // For non-gateway / manual orders: require Admin authorization to complete
            if (!IsAdminUser())
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    Success = false,
                    Message = "Only authorized administrators can manually complete transactions."
                });
            }

            var order = await _context.OrderSuccesses.FirstOrDefaultAsync(x => x.TransactionId == request.TransactionId);
            if (order == null)
            {
                return NotFound(new { Success = false, Message = "Transaction not found." });
            }

            order.PaymentStatus = "Success";
            order.OrderStatus = "Placed";
            await _context.SaveChangesAsync();

            return Ok(new { Success = true, Message = "Transaction completed by administrator." });
        }

        // GET: api/Payment/qr-code
        [HttpGet("qr-code")]
        public async Task<IActionResult> GetStaticQrCode()
        {
            var qrConfig = await _context.QrCodeConfigs.FirstOrDefaultAsync();
            if (qrConfig == null || string.IsNullOrEmpty(qrConfig.QrImageUrl))
            {
                return Ok(new { success = false, message = "No QR code configured by admin." });
            }

            var request = HttpContext.Request;
            string qrImageUrl = qrConfig.QrImageUrl;
            if (qrImageUrl.StartsWith("/"))
            {
                qrImageUrl = $"{request.Scheme}://{request.Host}{qrImageUrl}";
            }

            return Ok(new
            {
                success = true,
                qrImageUrl = qrImageUrl,
                updatedAt = qrConfig.UpdatedAt
            });
        }

        // GET: api/Payment/qr-code/{orderId}
        // GET: api/Payment/qr/{orderId}
        [HttpGet("qr/{orderId}")]
        [HttpGet("qr-code/{orderId}")]
        public async Task<IActionResult> GetOrderQrCode(string orderId, [FromQuery] decimal? amount)
        {
            if (string.IsNullOrEmpty(orderId))
            {
                return BadRequest(new { success = false, message = "OrderId is required." });
            }

            Order? dbOrder = null;
            if (int.TryParse(orderId, out int numericId))
            {
                dbOrder = await _context.Orders.FirstOrDefaultAsync(o => o.Id == numericId);
            }
            if (dbOrder == null)
            {
                dbOrder = await _context.Orders.FirstOrDefaultAsync(o => o.OrderNumber == orderId);
            }

            decimal finalAmount = amount ?? 0.0m;
            string orderNumberString = orderId;
            if (dbOrder != null)
            {
                finalAmount = dbOrder.FinalAmount;
                orderNumberString = dbOrder.OrderNumber;
            }

            var orderSuccess = await _context.OrderSuccesses.FirstOrDefaultAsync(o => 
                o.OrderId == orderId || 
                (dbOrder != null && o.OrderId == dbOrder.Id.ToString()) || 
                (dbOrder != null && o.OrderId == dbOrder.OrderNumber));
            
            decimal resolvedAmount = orderSuccess?.TotalAmount ?? finalAmount;
            if (resolvedAmount == 0.0m)
            {
                resolvedAmount = 2183.0m; // Fallback default amount
            }

            string transactionId = orderSuccess?.TransactionId ?? ("TXN" + DateTime.UtcNow.ToString("yyyyMMdd") + new Random().Next(100000, 999999).ToString());

            // Retrieve VPA Details from DB or Fallback (fallback VPA: honeywell@hdfcbank)
            var upiConfig = await _context.UpiDetailsConfigs.FirstOrDefaultAsync();
            string merchantUpi = upiConfig?.MerchantUpiId ?? "honeywell@hdfcbank";
            string merchantName = upiConfig?.MerchantName ?? "Honeywell Products India";
            string currency = upiConfig?.Currency ?? "INR";
            string note = "Order Payment";
            
            string upiPayload = $"upi://pay?pa={merchantUpi}&pn={Uri.EscapeDataString(merchantName)}&am={resolvedAmount}&cu={currency}&tn={Uri.EscapeDataString(note)}&tr={transactionId}";

            // Custom QR code image URL
            var qrConfig = await _context.QrCodeConfigs.FirstOrDefaultAsync();
            string qrImageUrl = "";
            if (qrConfig != null && !string.IsNullOrEmpty(qrConfig.QrImageUrl))
            {
                qrImageUrl = qrConfig.QrImageUrl;
                if (qrImageUrl.StartsWith("/"))
                {
                    var request = HttpContext.Request;
                    qrImageUrl = $"{request.Scheme}://{request.Host}{qrImageUrl}";
                }
            }
            else
            {
                qrImageUrl = $"https://api.qrserver.com/v1/create-qr-code/?size=250x250&data={Uri.EscapeDataString(upiPayload)}";
            }

            return Ok(new
            {
                success = true,
                orderId = orderNumberString,
                transactionId = transactionId,
                amount = resolvedAmount,
                qrImageUrl = qrImageUrl,
                qrPayload = upiPayload
            });
        }

        public class BankDetailsRequestDto
        {
            public string? AccountHolderName { get; set; }
            public string? BankName { get; set; }
            public string? AccountNumber { get; set; }
            public string? IfscCode { get; set; }
            public string? Branch { get; set; }
        }

        // GET: api/Payment/bank-details
        [HttpGet("bank-details")]
        public async Task<IActionResult> GetBankDetails()
        {
            var config = await _context.BankDetailsConfigs.FirstOrDefaultAsync();
            if (config != null)
            {
                if (config.AccountHolderName.ToLower().Contains("agro") || config.AccountHolderName.ToLower().Contains("shyam") || config.AccountNumber == "123456789012")
                {
                    config.AccountHolderName = "Honeywell Products & Solutions Pvt Ltd";
                    config.BankName = "HDFC Bank";
                    config.AccountNumber = "50200088991122";
                    config.IfscCode = "HDFC0000123";
                    config.Branch = "Cyber City Branch";
                    config.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                return Ok(new
                {
                    accountHolderName = config.AccountHolderName,
                    bankName = config.BankName,
                    accountNumber = config.AccountNumber,
                    ifscCode = config.IfscCode,
                    branch = config.Branch
                });
            }

            return Ok(new
            {
                accountHolderName = "Honeywell Products & Solutions Pvt Ltd",
                bankName = "HDFC Bank",
                accountNumber = "50200088991122",
                ifscCode = "HDFC0000123",
                branch = "Cyber City Branch"
            });
        }

        // PUT: api/Payment/bank-details
        // POST: api/Payment/bank-details
        [AuthorizeModule(PermissionAction.Edit, "orders", "settings", "payment settings")]
        [HttpPut("bank-details")]
        [HttpPost("bank-details")]
        public async Task<IActionResult> UpdateBankDetails([FromBody] BankDetailsRequestDto request)
        {
            if (request == null)
            {
                return BadRequest(new { Success = false, Message = "Request payload is required." });
            }

            var config = await _context.BankDetailsConfigs.FirstOrDefaultAsync();
            if (config == null)
            {
                config = new BankDetailsConfig();
                _context.BankDetailsConfigs.Add(config);
            }

            if (request.IfscCode != null) config.IfscCode = request.IfscCode.Trim();
            if (request.BankName != null) config.BankName = request.BankName.Trim();
            if (request.Branch != null) config.Branch = request.Branch.Trim();
            if (request.AccountNumber != null) config.AccountNumber = request.AccountNumber.Trim();
            if (request.AccountHolderName != null) config.AccountHolderName = request.AccountHolderName.Trim();
            config.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new
            {
                Success = true,
                Message = "Bank details updated successfully.",
                Data = new
                {
                    accountHolderName = config.AccountHolderName,
                    bankName = config.BankName,
                    accountNumber = config.AccountNumber,
                    ifscCode = config.IfscCode,
                    branch = config.Branch
                }
            });
        }

        public class UpiDetailsRequestDto
        {
            public string? MerchantName { get; set; }
            public string? MerchantUpiId { get; set; }
            public string? BankDisplayName { get; set; }
            public string? Currency { get; set; }
        }

        // GET: api/Payment/upi-details
        [HttpGet("upi-details")]
        public async Task<IActionResult> GetUpiDetails()
        {
            var config = await _context.UpiDetailsConfigs.FirstOrDefaultAsync();
            if (config != null)
            {
                if (config.MerchantName.ToLower().Contains("agro") || config.MerchantName.ToLower().Contains("shyam") || config.MerchantUpiId.Contains("9398649798"))
                {
                    config.MerchantName = "Honeywell Products India";
                    config.MerchantUpiId = "honeywell@hdfcbank";
                    config.BankDisplayName = "HDFC Bank - Corporate";
                    config.Currency = "INR";
                    config.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                return Ok(new
                {
                    merchantName = config.MerchantName,
                    merchantUpiId = config.MerchantUpiId,
                    bankDisplayName = config.BankDisplayName,
                    currency = config.Currency
                });
            }

            return Ok(new
            {
                merchantName = "Honeywell Products India",
                merchantUpiId = "honeywell@hdfcbank",
                bankDisplayName = "HDFC Bank - Corporate",
                currency = "INR"
            });
        }

        // PUT: api/Payment/upi-details
        // POST: api/Payment/upi-details
        [AuthorizeModule(PermissionAction.Edit, "orders", "settings", "payment settings")]
        [HttpPut("upi-details")]
        [HttpPost("upi-details")]
        public async Task<IActionResult> UpdateUpiDetails([FromBody] UpiDetailsRequestDto request)
        {
            if (request == null)
            {
                return BadRequest(new { Success = false, Message = "Request payload is required." });
            }

            var config = await _context.UpiDetailsConfigs.FirstOrDefaultAsync();
            if (config == null)
            {
                config = new UpiDetailsConfig();
                _context.UpiDetailsConfigs.Add(config);
            }

            if (request.MerchantUpiId != null) config.MerchantUpiId = request.MerchantUpiId.Trim();
            if (request.MerchantName != null) config.MerchantName = request.MerchantName.Trim();
            if (request.BankDisplayName != null) config.BankDisplayName = request.BankDisplayName.Trim();
            if (request.Currency != null) config.Currency = request.Currency.Trim();
            config.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new
            {
                Success = true,
                Message = "UPI details updated successfully.",
                Data = new
                {
                    merchantName = config.MerchantName,
                    merchantUpiId = config.MerchantUpiId,
                    bankDisplayName = config.BankDisplayName,
                    currency = config.Currency
                }
            });
        }

        // GET: api/Payment/qr-config
        [HttpGet("qr-config")]
        public async Task<IActionResult> GetQrConfig()
        {
            var config = await _context.QrCodeConfigs.FirstOrDefaultAsync();
            return Ok(new
            {
                qrImageUrl = config?.QrImageUrl ?? ""
            });
        }

        public class UpdateQrConfigRequest
        {
            public string? QrImageUrl { get; set; }
            public IFormFile? File { get; set; }
        }

        // PUT: api/Payment/qr-config
        [AuthorizeModule(PermissionAction.Edit, "orders", "settings", "payment settings")]
        [HttpPut("qr-config")]
        public async Task<IActionResult> UpdateQrConfig([FromForm] UpdateQrConfigRequest request)
        {
            string? finalUrl = request.QrImageUrl;

            if (request.File != null && request.File.Length > 0)
            {
                var folder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                Directory.CreateDirectory(folder);

                var extension = Path.GetExtension(request.File.FileName).ToLower();
                var fileName = "payment-qr-" + Guid.NewGuid().ToString().Substring(0, 8) + extension;
                var filePath = Path.Combine(folder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await request.File.CopyToAsync(stream);
                }

                finalUrl = "/uploads/" + fileName;
            }

            if (string.IsNullOrEmpty(finalUrl))
            {
                return BadRequest(new { Success = false, Message = "Either a valid QR Code file or QR Image URL is required." });
            }

            var config = await _context.QrCodeConfigs.FirstOrDefaultAsync();
            if (config == null)
            {
                config = new QrCodeConfig();
                _context.QrCodeConfigs.Add(config);
            }

            config.QrImageUrl = finalUrl;
            config.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { Success = true, Message = "QR Code configuration updated successfully.", Data = config });
        }

        // GET: api/Payment/manual-verifications
        [AuthorizeModule(PermissionAction.View, "orders", "settings", "payment settings")]
        [HttpGet("manual-verifications")]
        public async Task<IActionResult> GetManualVerifications([FromQuery] string? search, [FromQuery] string? status)
        {
            var query = _context.ManualPayments.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(v => v.OrderId.Contains(search) || 
                                         v.UtrNumber.Contains(search) || 
                                         v.CustomerName.Contains(search) || 
                                         v.MobileNumber.Contains(search));
            }

            if (!string.IsNullOrEmpty(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                // Align with verification status states: Pending, Approved/Verified, Rejected
                string filterStatus = status;
                if (status.Equals("Verified", StringComparison.OrdinalIgnoreCase)) filterStatus = "Approved";
                
                query = query.Where(v => v.VerificationStatus == filterStatus);
            }

            var verifications = await query.OrderByDescending(v => v.Id).ToListAsync();
            return Ok(verifications);
        }

        public class ManualStatusUpdateRequest
        {
            public string Status { get; set; } = string.Empty; // Approved (Verified) or Rejected
        }

        // PUT: api/Payment/verify-manual/{id}/status
        [AuthorizeModule(PermissionAction.Edit, "orders", "settings", "payment settings")]
        [HttpPut("verify-manual/{id}/status")]
        public async Task<IActionResult> UpdateManualStatus(int id, [FromBody] ManualStatusUpdateRequest request)
        {
            if (string.IsNullOrEmpty(request.Status))
            {
                return BadRequest(new { Success = false, Message = "Status is required." });
            }

            var verification = await _context.ManualPayments.FindAsync(id);
            if (verification == null)
            {
                return NotFound(new { Success = false, Message = "Manual verification record not found." });
            }

            string mappedStatus = request.Status;
            if (request.Status.Equals("Verified", StringComparison.OrdinalIgnoreCase) || 
                request.Status.Equals("Verify Success", StringComparison.OrdinalIgnoreCase))
            {
                mappedStatus = "Approved";
            }
            else if (request.Status.Equals("Reject", StringComparison.OrdinalIgnoreCase))
            {
                mappedStatus = "Rejected";
            }

            verification.VerificationStatus = mappedStatus;

            // Propagate status update to parent order tracking tables
            var orderSuccess = await _context.OrderSuccesses.FirstOrDefaultAsync(o => o.OrderId == verification.OrderId);
            if (orderSuccess != null)
            {
                orderSuccess.PaymentStatus = mappedStatus == "Approved" ? "Success" : "Failed";
                orderSuccess.OrderStatus = mappedStatus == "Approved" ? "Placed" : "Failed";
            }

            if (int.TryParse(verification.OrderId, out int numericOrderId))
            {
                var dbOrder = await _context.Orders.FindAsync(numericOrderId);
                if (dbOrder != null)
                {
                    dbOrder.Status = mappedStatus == "Approved" ? "Success" : "Failed";
                    dbOrder.PaymentStatus = mappedStatus == "Approved" ? "Success" : "Failed";
                }
            }
            else
            {
                var dbOrder = await _context.Orders.FirstOrDefaultAsync(o => o.OrderNumber == verification.OrderId || o.OrderNumber.Contains(verification.OrderId));
                if (dbOrder != null)
                {
                    dbOrder.Status = mappedStatus == "Approved" ? "Success" : "Failed";
                    dbOrder.PaymentStatus = mappedStatus == "Approved" ? "Success" : "Failed";
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { Success = true, Message = $"Verification status successfully updated to {mappedStatus}.", Data = verification });
        }

        // DELETE: api/Payment/verify-manual/{id}
        [AuthorizeModule(PermissionAction.Delete, "orders", "settings", "payment settings")]
        [HttpDelete("verify-manual/{id}")]
        public async Task<IActionResult> DeleteManualVerification(int id)
        {
            var verification = await _context.ManualPayments.FindAsync(id);
            if (verification == null)
            {
                return NotFound(new { Success = false, Message = "Verification record not found." });
            }

            _context.ManualPayments.Remove(verification);
            await _context.SaveChangesAsync();

            return Ok(new { Success = true, Message = "Verification record deleted successfully." });
        }

        public class VerifyManualRequest
        {
            public string OrderId { get; set; } = string.Empty;
            public string UtrNumber { get; set; } = string.Empty;
            public decimal AmountPaid { get; set; }
            public string PaymentDate { get; set; } = string.Empty;
            public string PaymentTime { get; set; } = string.Empty;
            public string CustomerName { get; set; } = string.Empty;
            public string MobileNumber { get; set; } = string.Empty;
            public string? Remarks { get; set; }
            public Microsoft.AspNetCore.Http.IFormFile? Screenshot { get; set; }
        }

        // POST: api/Payment/verify-manual
        [HttpPost("verify-manual")]
        public async Task<IActionResult> VerifyManual([FromForm] VerifyManualRequest request)
        {
            if (string.IsNullOrEmpty(request.OrderId))
                return BadRequest(new { Success = false, Message = "OrderId is required." });
            if (string.IsNullOrEmpty(request.UtrNumber))
                return BadRequest(new { Success = false, Message = "Transaction / UTR Number is required." });

            bool utrExists = await _context.ManualPayments.AnyAsync(m => m.UtrNumber == request.UtrNumber);
            if (utrExists)
            {
                return BadRequest(new { Success = false, Message = "This Transaction / UTR Number has already been submitted." });
            }

            if (request.AmountPaid <= 0)
                return BadRequest(new { Success = false, Message = "Amount Paid must be greater than zero." });
            if (string.IsNullOrEmpty(request.PaymentDate))
                return BadRequest(new { Success = false, Message = "Payment Date is required." });
            if (string.IsNullOrEmpty(request.PaymentTime))
                return BadRequest(new { Success = false, Message = "Payment Time is required." });
            if (string.IsNullOrEmpty(request.CustomerName))
                return BadRequest(new { Success = false, Message = "Customer Name is required." });
            if (string.IsNullOrEmpty(request.MobileNumber))
                return BadRequest(new { Success = false, Message = "Mobile Number is required." });

            string? screenshotUrl = null;
            if (request.Screenshot != null)
            {
                var folder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "screenshots");
                Directory.CreateDirectory(folder);

                var extension = Path.GetExtension(request.Screenshot.FileName).ToLower();
                var fileName = Guid.NewGuid().ToString() + extension;
                var filePath = Path.Combine(folder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await request.Screenshot.CopyToAsync(stream);
                }

                screenshotUrl = "/uploads/screenshots/" + fileName;
            }

            var verification = new ManualPayment
            {
                OrderId = request.OrderId,
                UtrNumber = request.UtrNumber,
                AmountPaid = request.AmountPaid,
                PaymentDate = request.PaymentDate,
                PaymentTime = request.PaymentTime,
                CustomerName = request.CustomerName,
                MobileNumber = request.MobileNumber,
                Remarks = request.Remarks,
                ScreenshotUrl = screenshotUrl,
                VerificationStatus = "Pending",
                SubmittedAt = DateTime.UtcNow
            };

            _context.ManualPayments.Add(verification);

            var orderSuccess = await _context.OrderSuccesses.FirstOrDefaultAsync(o => o.OrderId == request.OrderId);
            if (orderSuccess != null)
            {
                orderSuccess.PaymentStatus = "PendingVerification";
                orderSuccess.OrderStatus = "PendingVerification";
            }

            if (int.TryParse(request.OrderId, out int numericOrderId))
            {
                var dbOrder = await _context.Orders.FindAsync(numericOrderId);
                if (dbOrder != null)
                {
                    dbOrder.Status = "PendingVerification";
                    dbOrder.PaymentStatus = "PendingVerification";
                }
            }
            else
            {
                var dbOrder = await _context.Orders.FirstOrDefaultAsync(o => o.OrderNumber == request.OrderId || o.OrderNumber.Contains(request.OrderId));
                if (dbOrder != null)
                {
                    dbOrder.Status = "PendingVerification";
                    dbOrder.PaymentStatus = "PendingVerification";
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Success = true,
                Message = "Payment verification submitted successfully.",
                Data = verification
            });
        }

        public class ReconcileSmsRequest
        {
            public string SmsPayload { get; set; } = string.Empty;
        }

        // POST: api/Payment/reconcile-sms
        [HttpPost("reconcile-sms")]
        public async Task<IActionResult> ReconcileSms([FromBody] ReconcileSmsRequest request)
        {
            if (string.IsNullOrEmpty(request.SmsPayload))
            {
                return BadRequest(new { Success = false, Message = "SMS payload is required." });
            }

            string sms = request.SmsPayload;

            // 1. Parse UTR (look for 10-30 digit sequence)
            string parsedUtr = "";
            var utrMatch = System.Text.RegularExpressions.Regex.Match(sms, @"\b([0-9]{10,30})\b");
            if (utrMatch.Success)
            {
                parsedUtr = utrMatch.Groups[1].Value;
            }

            // 2. Parse Amount
            decimal parsedAmount = 0.0m;
            // Match pattern like Rs. 14,500 or INR 8,500 or Rs14500 or just - 14,500 or ₹14,500
            var amountMatch = System.Text.RegularExpressions.Regex.Match(sms, @"(?i)(?:Rs\.?|INR|₹|-)\s*([0-9,]+(?:\.[0-9]{2})?)");
            if (amountMatch.Success)
            {
                string amtStr = amountMatch.Groups[1].Value.Replace(",", "");
                decimal.TryParse(amtStr, out parsedAmount);
            }
            else
            {
                // Fallback: match any number with comma/dot
                var generalNumberMatch = System.Text.RegularExpressions.Regex.Matches(sms, @"\b([0-9,]+(?:\.[0-9]{2})?)\b");
                foreach (System.Text.RegularExpressions.Match m in generalNumberMatch)
                {
                    string clean = m.Groups[1].Value.Replace(",", "");
                    if (decimal.TryParse(clean, out decimal val) && val > 100)
                    {
                        parsedAmount = val;
                        break;
                    }
                }
            }

            // 3. Parse Order ID (optional)
            string parsedOrderId = "";
            var orderMatch = System.Text.RegularExpressions.Regex.Match(sms, @"(?i)\b(ORD|SAT)-?[0-9]+\b");
            if (orderMatch.Success)
            {
                parsedOrderId = orderMatch.Groups[0].Value;
            }

            if (string.IsNullOrEmpty(parsedUtr) && parsedAmount == 0)
            {
                return BadRequest(new { Success = false, Message = "Could not parse UTR or Amount from the SMS payload." });
            }

            ManualPayment? match = null;

            // Try exact match on UTR first
            if (!string.IsNullOrEmpty(parsedUtr))
            {
                match = await _context.ManualPayments.FirstOrDefaultAsync(m => 
                    m.VerificationStatus == "Pending" && 
                    (m.UtrNumber == parsedUtr || m.UtrNumber.Contains(parsedUtr) || parsedUtr.Contains(m.UtrNumber)));
            }

            // Try matching by OrderId if present
            if (match == null && !string.IsNullOrEmpty(parsedOrderId))
            {
                match = await _context.ManualPayments.FirstOrDefaultAsync(m => 
                    m.VerificationStatus == "Pending" && 
                    (m.OrderId == parsedOrderId || m.OrderId.Contains(parsedOrderId)));
            }

            // Try matching by Amount fallback if multiple pending exist
            if (match == null && parsedAmount > 0)
            {
                match = await _context.ManualPayments.FirstOrDefaultAsync(m => 
                    m.VerificationStatus == "Pending" && 
                    m.AmountPaid == parsedAmount);
            }

            if (match == null)
            {
                return Ok(new
                {
                    Success = false,
                    Message = $"No matching pending transaction found in database for UTR: {parsedUtr}, Amount: {parsedAmount}.",
                    ParsedUtr = parsedUtr,
                    ParsedAmount = parsedAmount,
                    ParsedOrderId = parsedOrderId
                });
            }

            // Reconcile and Approve!
            match.VerificationStatus = "Approved";

            // Propagate status update to parent order tracking tables
            var orderSuccess = await _context.OrderSuccesses.FirstOrDefaultAsync(o => o.OrderId == match.OrderId);
            if (orderSuccess != null)
            {
                orderSuccess.PaymentStatus = "Success";
                orderSuccess.OrderStatus = "Placed";
            }

            if (int.TryParse(match.OrderId, out int numericOrderId))
            {
                var dbOrder = await _context.Orders.FindAsync(numericOrderId);
                if (dbOrder != null)
                {
                    dbOrder.Status = "Success";
                    dbOrder.PaymentStatus = "Success";
                }
            }
            else
            {
                var dbOrder = await _context.Orders.FirstOrDefaultAsync(o => o.OrderNumber == match.OrderId || o.OrderNumber.Contains(match.OrderId));
                if (dbOrder != null)
                {
                    dbOrder.Status = "Success";
                    dbOrder.PaymentStatus = "Success";
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Success = true,
                Message = $"Reconciliation successful. Order #{match.OrderId} has been verified and processed.",
                ParsedUtr = parsedUtr,
                ParsedAmount = parsedAmount,
                OrderId = match.OrderId,
                CustomerName = match.CustomerName
            });
        }

        /// <summary>
        /// Admin endpoint to sweep and release expired unpaid inventory reservations.
        /// </summary>
        [HttpPost("reconcile-expired-reservations")]
        public async Task<IActionResult> ReconcileExpiredReservations([FromQuery] int timeoutMinutes = 60)
        {
            if (!IsAdminUser())
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { Message = "Admin privileges required." });
            }

            var released = await _cashfreeService.ReleaseExpiredInventoryReservationsAsync(TimeSpan.FromMinutes(timeoutMinutes));
            return Ok(new { Success = true, ReleasedOrdersCount = released });
        }
    }
}
