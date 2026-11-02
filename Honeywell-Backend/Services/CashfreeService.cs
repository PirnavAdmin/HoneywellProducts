using System;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Honeywell.Data;
using Honeywell.DTOs;
using Honeywell.Models;
using Honeywell.Services.Interfaces;

namespace Honeywell.Services
{
    public class CashfreeService : ICashfreeService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<CashfreeService> _logger;
        private readonly ApplicationDbContext _context;

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };

        public CashfreeService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<CashfreeService> logger,
            ApplicationDbContext context)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
            _context = context;
        }

        private string? GetAppId()
        {
            var envVal = Environment.GetEnvironmentVariable("CASHFREE_APP_ID");
            if (!string.IsNullOrWhiteSpace(envVal)) return envVal.Trim();
            var cfgVal = _configuration["Cashfree:AppId"];
            return !string.IsNullOrWhiteSpace(cfgVal) ? cfgVal.Trim() : null;
        }

        private string? GetSecretKey()
        {
            var envVal = Environment.GetEnvironmentVariable("CASHFREE_SECRET_KEY");
            if (!string.IsNullOrWhiteSpace(envVal)) return envVal.Trim();
            var cfgVal = _configuration["Cashfree:SecretKey"];
            return !string.IsNullOrWhiteSpace(cfgVal) ? cfgVal.Trim() : null;
        }

        public string GetEnvironment()
        {
            var envVal = Environment.GetEnvironmentVariable("CASHFREE_ENV");
            if (!string.IsNullOrWhiteSpace(envVal)) return envVal.Trim().ToLowerInvariant();
            var cfgVal = _configuration["Cashfree:Environment"];
            return !string.IsNullOrWhiteSpace(cfgVal) ? cfgVal.Trim().ToLowerInvariant() : "sandbox";
        }

        public string GetApiVersion()
        {
            var envVal = Environment.GetEnvironmentVariable("CASHFREE_API_VERSION");
            if (!string.IsNullOrWhiteSpace(envVal)) return envVal.Trim();
            var cfgVal = _configuration["Cashfree:ApiVersion"];
            return !string.IsNullOrWhiteSpace(cfgVal) ? cfgVal.Trim() : "2026-01-01";
        }

        private string GetBaseUrl()
        {
            var cfgUrl = _configuration["Cashfree:BaseUrl"];
            if (!string.IsNullOrWhiteSpace(cfgUrl)) return cfgUrl.Trim().TrimEnd('/');

            var env = GetEnvironment();
            return (env == "production" || env == "prod")
                ? "https://api.cashfree.com/pg"
                : "https://sandbox.cashfree.com/pg";
        }

        public bool IsConfigured()
        {
            return !string.IsNullOrWhiteSpace(GetAppId()) && !string.IsNullOrWhiteSpace(GetSecretKey());
        }

        public async Task<CashfreeOrderCreationResponse> CreatePaymentOrderAsync(
            Order order,
            string? returnUrl = null,
            string? notifyUrl = null,
            string? idempotencyKey = null)
        {
            if (order == null)
            {
                return new CashfreeOrderCreationResponse
                {
                    Success = false,
                    Message = "Application order reference is required."
                };
            }

            // Check if gateway credentials are setup
            if (!IsConfigured())
            {
                _logger.LogWarning("Cashfree payment initiation attempted but credentials (CASHFREE_APP_ID/CASHFREE_SECRET_KEY) are not configured.");
                return new CashfreeOrderCreationResponse
                {
                    Success = false,
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    Message = "Cashfree payment gateway credentials are not configured on the server. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY."
                };
            }

            // Check for existing active Cashfree session (Idempotency check)
            var fifteenMinutesAgo = DateTime.UtcNow.AddMinutes(-15);
            var existingTxQuery = _context.PaymentTransactions
                .Where(t => t.OrderId == order.Id && t.Gateway == "Cashfree" && (t.Status == "Created" || t.Status == "Pending"));

            if (!string.IsNullOrWhiteSpace(idempotencyKey))
            {
                var idempTx = await existingTxQuery.FirstOrDefaultAsync(t => t.IdempotencyKey == idempotencyKey);
                if (idempTx != null && !string.IsNullOrWhiteSpace(idempTx.PaymentSessionId))
                {
                    _logger.LogInformation("Returning existing active payment session for order {OrderNumber} with matching idempotency key.", order.OrderNumber);
                    return new CashfreeOrderCreationResponse
                    {
                        Success = true,
                        Message = "Existing active payment session returned.",
                        OrderId = order.Id,
                        OrderNumber = order.OrderNumber,
                        CfOrderId = idempTx.CfOrderId,
                        PaymentSessionId = idempTx.PaymentSessionId,
                        Amount = idempTx.Amount,
                        Currency = idempTx.Currency,
                        Environment = GetEnvironment(),
                        Status = idempTx.Status
                    };
                }
            }

            var recentActiveTx = await existingTxQuery
                .Where(t => t.CreatedAt >= fifteenMinutesAgo && !string.IsNullOrWhiteSpace(t.PaymentSessionId))
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();

            if (recentActiveTx != null)
            {
                _logger.LogInformation("Returning recent active payment session {CfOrderId} for order {OrderNumber}.", recentActiveTx.CfOrderId, order.OrderNumber);
                return new CashfreeOrderCreationResponse
                {
                    Success = true,
                    Message = "Active Cashfree payment session returned.",
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    CfOrderId = recentActiveTx.CfOrderId,
                    PaymentSessionId = recentActiveTx.PaymentSessionId,
                    Amount = recentActiveTx.Amount,
                    Currency = recentActiveTx.Currency,
                    Environment = GetEnvironment(),
                    Status = recentActiveTx.Status
                };
            }

            // Always calculate amount from the verified database record
            decimal paymentAmount = order.FinalAmount > 0 ? order.FinalAmount : order.TotalAmount;
            if (paymentAmount <= 0)
            {
                return new CashfreeOrderCreationResponse
                {
                    Success = false,
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    Message = "Invalid order amount. Amount must be greater than zero."
                };
            }

            // Generate unique Cashfree Order ID (alphanumeric, underscores, hyphens, max 50 chars)
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var sanitizedOrderNumber = Regex.Replace(order.OrderNumber, @"[^a-zA-Z0-9_-]", "_");
            if (sanitizedOrderNumber.Length > 24) sanitizedOrderNumber = sanitizedOrderNumber[..24];
            var cfOrderId = $"cf_{order.Id}_{sanitizedOrderNumber}_{timestamp}";
            if (cfOrderId.Length > 50) cfOrderId = cfOrderId[..50];

            // Resolve Customer Details
            var customer = order.Customer ?? await _context.Customers.FindAsync(order.CustomerId);
            var customerName = customer?.Name ?? (!string.IsNullOrWhiteSpace(order.ShippingAddress) ? "Customer" : "Guest");
            var customerEmail = customer?.Email;
            var customerPhone = SanitizePhoneNumber(customer?.Phone);
            var customerId = customer != null && customer.Id > 0
                ? $"cust_{customer.Id}"
                : $"cust_ord_{order.Id}";

            // Resolve Return & Notify URLs
            var effectiveReturnUrl = !string.IsNullOrWhiteSpace(returnUrl)
                ? returnUrl
                : _configuration["Cashfree:ReturnUrl"] ?? "http://localhost:5173/order-success?order_id={order_id}";

            var effectiveNotifyUrl = !string.IsNullOrWhiteSpace(notifyUrl)
                ? notifyUrl
                : _configuration["Cashfree:NotifyUrl"] ?? "http://localhost:5119/api/Payment/cashfree-webhook";

            // Prepare Cashfree API payload
            var payload = new CashfreePgCreateOrderPayload
            {
                OrderId = cfOrderId,
                OrderAmount = paymentAmount,
                OrderCurrency = "INR",
                CustomerDetails = new CashfreePgCustomerDetails
                {
                    CustomerId = customerId,
                    CustomerName = customerName,
                    CustomerEmail = !string.IsNullOrWhiteSpace(customerEmail) ? customerEmail : "customer@example.com",
                    CustomerPhone = customerPhone
                },
                OrderMeta = new CashfreePgOrderMeta
                {
                    ReturnUrl = effectiveReturnUrl,
                    NotifyUrl = effectiveNotifyUrl
                },
                OrderNote = $"Payment for Order #{order.OrderNumber}"
            };

            // Create initial database transaction record
            var transaction = new PaymentTransaction
            {
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                Gateway = "Cashfree",
                CfOrderId = cfOrderId,
                Amount = paymentAmount,
                Currency = "INR",
                Status = "Created",
                CustomerId = customer?.Id,
                CustomerName = customerName,
                CustomerEmail = customerEmail,
                CustomerPhone = customerPhone,
                PaymentMethod = "Cashfree Hosted",
                IdempotencyKey = idempotencyKey,
                CreatedAt = DateTime.UtcNow
            };

            _context.PaymentTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            // Send request to Cashfree Sandbox API
            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
                using var requestMessage = new HttpRequestMessage(HttpMethod.Post, $"{GetBaseUrl()}/orders");

                requestMessage.Headers.Add("x-client-id", GetAppId());
                requestMessage.Headers.Add("x-client-secret", GetSecretKey());
                requestMessage.Headers.Add("x-api-version", GetApiVersion());
                requestMessage.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                if (!string.IsNullOrWhiteSpace(idempotencyKey))
                {
                    requestMessage.Headers.Add("x-idempotency-key", idempotencyKey);
                }

                var jsonPayload = JsonSerializer.Serialize(payload, JsonOptions);
                requestMessage.Content = new StringContent(jsonPayload, System.Text.Encoding.UTF8, "application/json");

                _logger.LogInformation("Calling Cashfree Sandbox Create Order for Order #{OrderNumber} (Amount: INR {Amount}, CfOrderId: {CfOrderId}).",
                    order.OrderNumber, paymentAmount, cfOrderId);

                var response = await _httpClient.SendAsync(requestMessage, cts.Token);
                var responseContent = await response.Content.ReadAsStringAsync(cts.Token);

                if (response.IsSuccessStatusCode)
                {
                    var cfOrder = JsonSerializer.Deserialize<CashfreePgOrderResponse>(responseContent, JsonOptions);
                    var sessionId = cfOrder?.PaymentSessionId;

                    if (string.IsNullOrWhiteSpace(sessionId))
                    {
                        transaction.Status = "Failed";
                        transaction.ErrorMessage = "Cashfree API succeeded but returned empty payment_session_id.";
                        transaction.RawResponse = responseContent;
                        transaction.UpdatedAt = DateTime.UtcNow;
                        await _context.SaveChangesAsync();

                        return new CashfreeOrderCreationResponse
                        {
                            Success = false,
                            OrderId = order.Id,
                            OrderNumber = order.OrderNumber,
                            CfOrderId = cfOrderId,
                            Message = "Payment gateway session could not be established."
                        };
                    }

                    // Update transaction record with session info
                    transaction.PaymentSessionId = sessionId;
                    transaction.Status = "Pending";
                    transaction.RawResponse = responseContent;
                    transaction.UpdatedAt = DateTime.UtcNow;

                    // Update application order payment method without marking it paid
                    order.PaymentMethod = "Cashfree";
                    order.PaymentStatus = "Pending";

                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Cashfree order {CfOrderId} created successfully with payment session ID.", cfOrderId);

                    return new CashfreeOrderCreationResponse
                    {
                        Success = true,
                        Message = "Cashfree payment session created successfully.",
                        OrderId = order.Id,
                        OrderNumber = order.OrderNumber,
                        CfOrderId = cfOrderId,
                        PaymentSessionId = sessionId,
                        Amount = paymentAmount,
                        Currency = "INR",
                        Environment = GetEnvironment(),
                        Status = "Pending"
                    };
                }
                else
                {
                    string safeErrorMessage = "Failed to create Cashfree payment order.";
                    string? errorCode = null;

                    try
                    {
                        var errorObj = JsonSerializer.Deserialize<CashfreePgOrderResponse>(responseContent, JsonOptions);
                        if (!string.IsNullOrWhiteSpace(errorObj?.Message))
                        {
                            safeErrorMessage = errorObj.Message;
                        }
                        errorCode = errorObj?.Code;
                    }
                    catch
                    {
                        safeErrorMessage = $"Cashfree API error (HTTP {(int)response.StatusCode}).";
                    }

                    _logger.LogError("Cashfree Create Order failed. HTTP {StatusCode}. Message: {Message}",
                        (int)response.StatusCode, safeErrorMessage);

                    transaction.Status = "Failed";
                    transaction.ErrorMessage = safeErrorMessage;
                    transaction.RawResponse = responseContent;
                    transaction.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();

                    return new CashfreeOrderCreationResponse
                    {
                        Success = false,
                        OrderId = order.Id,
                        OrderNumber = order.OrderNumber,
                        CfOrderId = cfOrderId,
                        ErrorCode = errorCode,
                        Message = safeErrorMessage
                    };
                }
            }
            catch (TaskCanceledException)
            {
                _logger.LogError("Cashfree Sandbox API request timed out for Order #{OrderNumber}.", order.OrderNumber);
                transaction.Status = "Failed";
                transaction.ErrorMessage = "Cashfree payment gateway request timed out. Please try again.";
                transaction.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return new CashfreeOrderCreationResponse
                {
                    Success = false,
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    CfOrderId = cfOrderId,
                    Message = "Payment gateway request timed out. Please retry."
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error calling Cashfree Sandbox API for Order #{OrderNumber}.", order.OrderNumber);
                transaction.Status = "Failed";
                transaction.ErrorMessage = "A network or system error occurred while contacting Cashfree.";
                transaction.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return new CashfreeOrderCreationResponse
                {
                    Success = false,
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    CfOrderId = cfOrderId,
                    Message = "An unexpected error occurred while communicating with the payment gateway."
                };
            }
        }

        public async Task<CashfreePgOrderResponse?> GetCashfreeOrderAsync(string cfOrderId)
        {
            if (string.IsNullOrWhiteSpace(cfOrderId) || !IsConfigured()) return null;

            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
                using var requestMessage = new HttpRequestMessage(HttpMethod.Get, $"{GetBaseUrl()}/orders/{Uri.EscapeDataString(cfOrderId)}");

                requestMessage.Headers.Add("x-client-id", GetAppId());
                requestMessage.Headers.Add("x-client-secret", GetSecretKey());
                requestMessage.Headers.Add("x-api-version", GetApiVersion());
                requestMessage.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var response = await _httpClient.SendAsync(requestMessage, cts.Token);
                if (!response.IsSuccessStatusCode) return null;

                var content = await response.Content.ReadAsStringAsync(cts.Token);
                return JsonSerializer.Deserialize<CashfreePgOrderResponse>(content, JsonOptions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching Cashfree order {CfOrderId}.", cfOrderId);
                return null;
            }
        }

        private static string SanitizePhoneNumber(string? phone)
        {
            if (string.IsNullOrWhiteSpace(phone)) return "9999999999";

            var digits = Regex.Replace(phone, @"\D", "");
            if (digits.Length == 12 && digits.StartsWith("91"))
            {
                digits = digits[2..];
            }
            else if (digits.Length == 11 && digits.StartsWith("0"))
            {
                digits = digits[1..];
            }

            if (digits.Length == 10 && digits[0] >= '6' && digits[0] <= '9')
            {
                return digits;
            }

            if (digits.Length >= 10)
            {
                return digits[^10..];
            }

            return "9999999999";
        }
    }
}
