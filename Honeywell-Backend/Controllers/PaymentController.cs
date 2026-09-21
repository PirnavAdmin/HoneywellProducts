using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Honeywell.Data;
using Honeywell.Models;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Honeywell.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PaymentController(ApplicationDbContext context)
        {
            _context = context;
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
            var order = await _context.OrderSuccesses.FirstOrDefaultAsync(x => x.TransactionId == request.TransactionId);
            if (order == null)
            {
                return NotFound(new { Success = false, Message = "Transaction not found." });
            }

            order.PaymentStatus = "Success";
            order.OrderStatus = "Placed";
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Success = true,
                TransactionId = order.TransactionId,
                OrderId = order.OrderId,
                Message = "Payment completed successfully."
            });
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
                return Ok(new
                {
                    accountHolderName = config.AccountHolderName,
                    AccountHolderName = config.AccountHolderName,
                    bankName = config.BankName,
                    BankName = config.BankName,
                    accountNumber = config.AccountNumber,
                    AccountNumber = config.AccountNumber,
                    ifscCode = config.IfscCode,
                    IfscCode = config.IfscCode,
                    branch = config.Branch,
                    Branch = config.Branch
                });
            }

            return Ok(new
            {
                accountHolderName = "Honeywell Products & Solutions Pvt Ltd",
                AccountHolderName = "Honeywell Products & Solutions Pvt Ltd",
                bankName = "HDFC Bank",
                BankName = "HDFC Bank",
                accountNumber = "50200088991122",
                AccountNumber = "50200088991122",
                ifscCode = "HDFC0000123",
                IfscCode = "HDFC0000123",
                branch = "Cyber City Branch",
                Branch = "Cyber City Branch"
            });
        }

        // PUT: api/Payment/bank-details
        // POST: api/Payment/bank-details
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

            if (!string.IsNullOrWhiteSpace(request.IfscCode)) config.IfscCode = request.IfscCode.Trim();
            if (!string.IsNullOrWhiteSpace(request.BankName)) config.BankName = request.BankName.Trim();
            if (!string.IsNullOrWhiteSpace(request.Branch)) config.Branch = request.Branch.Trim();
            if (!string.IsNullOrWhiteSpace(request.AccountNumber)) config.AccountNumber = request.AccountNumber.Trim();
            if (!string.IsNullOrWhiteSpace(request.AccountHolderName)) config.AccountHolderName = request.AccountHolderName.Trim();
            config.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new
            {
                Success = true,
                Message = "Bank details updated successfully.",
                Data = new
                {
                    accountHolderName = config.AccountHolderName,
                    AccountHolderName = config.AccountHolderName,
                    bankName = config.BankName,
                    BankName = config.BankName,
                    accountNumber = config.AccountNumber,
                    AccountNumber = config.AccountNumber,
                    ifscCode = config.IfscCode,
                    IfscCode = config.IfscCode,
                    branch = config.Branch,
                    Branch = config.Branch
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
                return Ok(new
                {
                    merchantName = config.MerchantName,
                    MerchantName = config.MerchantName,
                    merchantUpiId = config.MerchantUpiId,
                    MerchantUpiId = config.MerchantUpiId,
                    bankDisplayName = config.BankDisplayName,
                    BankDisplayName = config.BankDisplayName,
                    currency = config.Currency,
                    Currency = config.Currency
                });
            }

            return Ok(new
            {
                merchantName = "Honeywell Products India",
                MerchantName = "Honeywell Products India",
                merchantUpiId = "honeywell@hdfcbank",
                MerchantUpiId = "honeywell@hdfcbank",
                bankDisplayName = "HDFC Bank - Corporate",
                BankDisplayName = "HDFC Bank - Corporate",
                currency = "INR",
                Currency = "INR"
            });
        }

        // PUT: api/Payment/upi-details
        // POST: api/Payment/upi-details
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

            if (!string.IsNullOrWhiteSpace(request.MerchantUpiId)) config.MerchantUpiId = request.MerchantUpiId.Trim();
            if (!string.IsNullOrWhiteSpace(request.MerchantName)) config.MerchantName = request.MerchantName.Trim();
            if (!string.IsNullOrWhiteSpace(request.BankDisplayName)) config.BankDisplayName = request.BankDisplayName.Trim();
            if (!string.IsNullOrWhiteSpace(request.Currency)) config.Currency = request.Currency.Trim();
            config.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new
            {
                Success = true,
                Message = "UPI details updated successfully.",
                Data = new
                {
                    merchantName = config.MerchantName,
                    MerchantName = config.MerchantName,
                    merchantUpiId = config.MerchantUpiId,
                    MerchantUpiId = config.MerchantUpiId,
                    bankDisplayName = config.BankDisplayName,
                    BankDisplayName = config.BankDisplayName,
                    currency = config.Currency,
                    Currency = config.Currency
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

            var verifications = await query.OrderByDescending(v => v.SubmittedAt).ToListAsync();
            return Ok(verifications);
        }

        public class ManualStatusUpdateRequest
        {
            public string Status { get; set; } = string.Empty; // Approved (Verified) or Rejected
        }

        // PUT: api/Payment/verify-manual/{id}/status
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
    }
}
