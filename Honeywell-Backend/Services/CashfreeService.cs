using System.Security.Cryptography;
using System.Text;
using System.Collections.Generic;
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
            var key = !string.IsNullOrWhiteSpace(envVal) ? envVal.Trim() : _configuration["Cashfree:SecretKey"]?.Trim();
            if (!string.IsNullOrWhiteSpace(key) &&
                (key.StartsWith("cfsk_ma_prod_", StringComparison.OrdinalIgnoreCase) ||
                 key.StartsWith("prod_", StringComparison.OrdinalIgnoreCase)))
            {
                throw new InvalidOperationException("CRITICAL SECURITY ERROR: Production Cashfree secret key detected in sandbox environment! Production keys are strictly prohibited.");
            }
            return key;
        }

        public string GetEnvironment()
        {
            // Requirement 2: Set environment to sandbox exclusively.
            return "sandbox";
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
            // Requirement 3: Use https://sandbox.cashfree.com/pg exclusively.
            return "https://sandbox.cashfree.com/pg";
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
                : Environment.GetEnvironmentVariable("CASHFREE_RETURN_URL")
                  ?? _configuration["Cashfree:ReturnUrl"]
                  ?? "http://localhost:5173/order-success?order_id={order_id}";

            // Security: Webhook notification URL must strictly come from server environment or configuration, NEVER from client request
            var configuredNotifyUrl = Environment.GetEnvironmentVariable("CASHFREE_NOTIFY_URL")
                ?? _configuration["Cashfree:NotifyUrl"];

            // Requirement 8: Include the notify URL when a publicly reachable webhook endpoint is available.
            string? effectiveNotifyUrl = null;
            if (!string.IsNullOrWhiteSpace(configuredNotifyUrl) &&
                configuredNotifyUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase) &&
                !configuredNotifyUrl.Contains("localhost", StringComparison.OrdinalIgnoreCase) &&
                !configuredNotifyUrl.Contains("127.0.0.1"))
            {
                effectiveNotifyUrl = configuredNotifyUrl.Trim();
            }

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

        
        public bool VerifyWebhookSignature(string rawBody, string timestamp, string signatureHeader)
        {
            if (string.IsNullOrWhiteSpace(rawBody) ||
                string.IsNullOrWhiteSpace(timestamp) ||
                string.IsNullOrWhiteSpace(signatureHeader))
            {
                return false;
            }

            var secretKey = GetSecretKey();
            if (string.IsNullOrWhiteSpace(secretKey))
            {
                _logger.LogWarning("Cannot verify Cashfree webhook signature: CASHFREE_SECRET_KEY is missing.");
                return false;
            }

            try
            {
                var dataToSign = timestamp + rawBody;
                using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secretKey));
                byte[] computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(dataToSign));
                string computedBase64 = Convert.ToBase64String(computedHash);

                // Replay window protection: reject webhooks older than 5 minutes if timestamp is epoch
                if (long.TryParse(timestamp.Trim(), out var ts))
                {
                    var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                    if (ts > 1000000000000) ts /= 1000;
                    if (ts > 1600000000 && Math.Abs(now - ts) > 300)
                    {
                        _logger.LogWarning("Webhook timestamp {Timestamp} rejected: Exceeds 5-minute replay window (now={Now}).", ts, now);
                        return false;
                    }
                }

                byte[] actualHash;
                try
                {
                    actualHash = Convert.FromBase64String(signatureHeader.Trim());
                }
                catch
                {
                    return false;
                }

                if (computedHash.Length != actualHash.Length) return false;
                return CryptographicOperations.FixedTimeEquals(computedHash, actualHash);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while verifying webhook signature.");
                return false;
            }
        }

        public async Task<List<CashfreePgPaymentEntity>?> GetCashfreeOrderPaymentsAsync(string cfOrderId)
        {
            if (string.IsNullOrWhiteSpace(cfOrderId) || !IsConfigured()) return null;

            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
                using var requestMessage = new HttpRequestMessage(HttpMethod.Get, $"{GetBaseUrl()}/orders/{Uri.EscapeDataString(cfOrderId)}/payments");

                requestMessage.Headers.Add("x-client-id", GetAppId());
                requestMessage.Headers.Add("x-client-secret", GetSecretKey());
                requestMessage.Headers.Add("x-api-version", GetApiVersion());
                requestMessage.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var response = await _httpClient.SendAsync(requestMessage, cts.Token);
                if (!response.IsSuccessStatusCode) return null;

                var content = await response.Content.ReadAsStringAsync(cts.Token);
                return JsonSerializer.Deserialize<List<CashfreePgPaymentEntity>>(content, JsonOptions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching Cashfree order payments for {CfOrderId}.", cfOrderId);
                return null;
            }
        }

        public async Task<CashfreeWebhookProcessResult> ProcessWebhookAsync(string rawBody, string timestamp, string signatureHeader)
        {
            if (!VerifyWebhookSignature(rawBody, timestamp, signatureHeader))
            {
                _logger.LogWarning("Cashfree Webhook rejected: Invalid signature or timestamp.");
                return new CashfreeWebhookProcessResult
                {
                    Success = false,
                    StatusCode = 401,
                    Message = "Invalid webhook signature."
                };
            }

            CashfreeWebhookPayload? payload;
            try
            {
                payload = JsonSerializer.Deserialize<CashfreeWebhookPayload>(rawBody, JsonOptions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to deserialize Cashfree webhook payload JSON.");
                return new CashfreeWebhookProcessResult
                {
                    Success = false,
                    StatusCode = 400,
                    Message = "Malformed webhook payload JSON."
                };
            }

            if (payload?.Data?.Order == null || payload.Data.Payment == null)
            {
                return new CashfreeWebhookProcessResult
                {
                    Success = false,
                    StatusCode = 400,
                    Message = "Missing order or payment data in webhook payload."
                };
            }

            var cfOrderId = payload.Data.Order.OrderId;
            var cfPaymentId = payload.Data.Payment.CfPaymentId?.ToString() ?? "";
            var paymentStatus = payload.Data.Payment.PaymentStatus?.ToUpperInvariant() ?? "";
            var paymentAmount = payload.Data.Payment.PaymentAmount;
            var paymentCurrency = payload.Data.Payment.PaymentCurrency ?? "INR";
            var eventType = payload.Type ?? "";

            _logger.LogInformation("Processing Cashfree Webhook {EventType} for CfOrderId: {CfOrderId}, PaymentId: {CfPaymentId}, Status: {PaymentStatus}.",
                eventType, cfOrderId, cfPaymentId, paymentStatus);

            var tx = await _context.PaymentTransactions
                .FirstOrDefaultAsync(t => t.Gateway == "Cashfree" && t.CfOrderId == cfOrderId);

            if (tx == null)
            {
                _logger.LogWarning("Webhook received for unknown Cashfree OrderId: {CfOrderId}.", cfOrderId);
                return new CashfreeWebhookProcessResult
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Transaction not tracked locally."
                };
            }

            var order = await _context.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == tx.OrderId);

            if (order == null)
            {
                _logger.LogWarning("Application order not found for Transaction Id: {TxId}.", tx.Id);
                return new CashfreeWebhookProcessResult { Success = true, StatusCode = 200, Message = "Order not found." };
            }

            bool isAlreadyPaid = order.PaymentStatus.Equals("Paid", StringComparison.OrdinalIgnoreCase) ||
                                 order.PaymentStatus.Equals("Success", StringComparison.OrdinalIgnoreCase) ||
                                 order.PaymentStatus.Equals("Verified Paid", StringComparison.OrdinalIgnoreCase);

            if (eventType == "PAYMENT_SUCCESS_WEBHOOK" || paymentStatus == "SUCCESS")
            {
                decimal expectedAmount = order.FinalAmount > 0 ? order.FinalAmount : order.TotalAmount;
                long expectedPaise = (long)Math.Round(expectedAmount * 100m, MidpointRounding.AwayFromZero);
                long receivedPaise = (long)Math.Round(paymentAmount * 100m, MidpointRounding.AwayFromZero);

                if (expectedPaise != receivedPaise)
                {
                    _logger.LogError("Payment amount mismatch in webhook! Expected: {ExpectedPaise} paise (INR {Expected:F2}), Received: {ReceivedPaise} paise (INR {Received:F2}).",
                        expectedPaise, expectedAmount, receivedPaise, paymentAmount);
                    tx.Status = "AmountMismatch";
                    tx.ErrorMessage = $"Received INR {paymentAmount:F2} ({receivedPaise} paise) but expected INR {expectedAmount:F2} ({expectedPaise} paise).";
                    tx.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();

                    return new CashfreeWebhookProcessResult
                    {
                        Success = false,
                        StatusCode = 400,
                        Message = "Payment amount does not match application order amount."
                    };
                }

                if (!string.Equals(paymentCurrency, "INR", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogError("Payment currency mismatch! Expected INR, Received: {Currency}.", paymentCurrency);
                    return new CashfreeWebhookProcessResult { Success = false, StatusCode = 400, Message = "Currency mismatch." };
                }

                tx.Status = "Success";
                tx.CfPaymentId = cfPaymentId;
                tx.BankReference = payload.Data.Payment.BankReference;
                tx.PaymentGroup = payload.Data.Payment.PaymentGroup;
                tx.VerifiedAt = DateTime.UtcNow;
                tx.WebhookProcessedAt = DateTime.UtcNow;
                tx.WebhookEventType = eventType;
                tx.UpdatedAt = DateTime.UtcNow;

                if (!isAlreadyPaid)
                {
                    order.PaymentStatus = "Paid";
                    order.PaymentMethod = $"Cashfree ({payload.Data.Payment.PaymentGroup ?? "Online"})";
                    if (order.Status.Equals("Pending", StringComparison.OrdinalIgnoreCase))
                    {
                        order.Status = "Processing";
                    }
                    else if (order.Status.Equals("Expired", StringComparison.OrdinalIgnoreCase) ||
                             order.Status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
                    {
                        // Late payment confirmation for expired/cancelled reservation: Re-check inventory
                        var orderItems = (order.Items != null && order.Items.Count > 0)
                            ? order.Items
                            : await _context.OrderItems.Where(i => i.OrderId == order.Id).ToListAsync();

                        bool stockAvailable = orderItems.Count > 0;
                        foreach (var item in orderItems)
                        {
                            var prod = await _context.Products.FindAsync(item.ProductId);
                            if (prod == null || prod.Stock < item.Quantity)
                            {
                                stockAvailable = false;
                                break;
                            }
                        }

                        if (stockAvailable)
                        {
                            foreach (var item in orderItems)
                            {
                                var prod = await _context.Products.FindAsync(item.ProductId);
                                if (prod != null) prod.Stock -= item.Quantity;
                            }
                            order.Status = "Processing";
                        }
                        else
                        {
                            order.Status = "RequiresReview";
                            _context.OrderTrackingLogs.Add(new OrderTrackingLog
                            {
                                OrderId = order.Id,
                                Status = "RequiresReview",
                                Description = "Late payment received for expired reservation, but inventory is exhausted. Order flagged for manual review / backorder fulfillment.",
                                CreatedAt = DateTime.UtcNow
                            });
                        }
                    }

                    if (order.Status != "RequiresReview")
                    {
                        _context.OrderTrackingLogs.Add(new OrderTrackingLog
                        {
                            OrderId = order.Id,
                            Status = order.Status,
                            Description = $"Payment of INR {order.FinalAmount:N2} verified via Cashfree Webhook ({eventType}). Ref: {cfPaymentId}.",
                            CreatedAt = DateTime.UtcNow
                        });
                    }

                    _context.Notifications.Add(new Notification
                    {
                        Title = "Payment Verified",
                        Message = $"Payment of INR {order.FinalAmount:N2} verified for Order #{order.OrderNumber}.",
                        Type = "PaymentReceived"
                    });
                }

                await _context.SaveChangesAsync();
                return new CashfreeWebhookProcessResult
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Payment success processed successfully."
                };
            }
            else if (eventType == "PAYMENT_FAILED_WEBHOOK" || paymentStatus == "FAILED")
            {
                if (!isAlreadyPaid)
                {
                    tx.Status = "Failed";
                    tx.CfPaymentId = cfPaymentId;
                    tx.ErrorMessage = payload.Data.Payment.PaymentMessage ?? "Payment failed at Cashfree.";
                    tx.WebhookProcessedAt = DateTime.UtcNow;
                    tx.WebhookEventType = eventType;
                    tx.UpdatedAt = DateTime.UtcNow;

                    order.PaymentStatus = "Failed";
                    await _context.SaveChangesAsync();
                }

                return new CashfreeWebhookProcessResult
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Payment failure recorded."
                };
            }
            else if (eventType == "PAYMENT_USER_DROPPED_WEBHOOK" || paymentStatus == "USER_DROPPED")
            {
                if (!isAlreadyPaid)
                {
                    tx.Status = "UserDropped";
                    tx.ErrorMessage = "Customer cancelled or closed checkout before completion.";
                    tx.WebhookProcessedAt = DateTime.UtcNow;
                    tx.WebhookEventType = eventType;
                    tx.UpdatedAt = DateTime.UtcNow;

                    await _context.SaveChangesAsync();
                }

                return new CashfreeWebhookProcessResult
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "User dropped event recorded."
                };
            }

            return new CashfreeWebhookProcessResult
            {
                Success = true,
                StatusCode = 200,
                Message = $"Event {eventType} acknowledged."
            };
        }

        public async Task<CashfreePaymentVerificationResult> VerifyAndReconcileOrderPaymentAsync(string orderRef)
        {
            if (string.IsNullOrWhiteSpace(orderRef))
            {
                return new CashfreePaymentVerificationResult
                {
                    Success = false,
                    Message = "Order reference is required."
                };
            }

            var cleanRef = orderRef.Trim();
            var tx = await _context.PaymentTransactions
                .Where(t => t.Gateway == "Cashfree" && (t.OrderNumber == cleanRef || t.CfOrderId == cleanRef || t.OrderId.ToString() == cleanRef))
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();

            if (tx == null)
            {
                return new CashfreePaymentVerificationResult
                {
                    Success = false,
                    Message = $"No payment transaction found for order '{orderRef}'."
                };
            }

            var order = await _context.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == tx.OrderId);

            if (order == null)
            {
                return new CashfreePaymentVerificationResult
                {
                    Success = false,
                    Message = "Associated application order was not found."
                };
            }

            bool isAlreadyPaid = order.PaymentStatus.Equals("Paid", StringComparison.OrdinalIgnoreCase) ||
                                 order.PaymentStatus.Equals("Success", StringComparison.OrdinalIgnoreCase) ||
                                 order.PaymentStatus.Equals("Verified Paid", StringComparison.OrdinalIgnoreCase);

            if (isAlreadyPaid)
            {
                return new CashfreePaymentVerificationResult
                {
                    Success = true,
                    IsPaid = true,
                    Status = "Paid",
                    Message = "Payment has already been verified and confirmed.",
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    CfOrderId = tx.CfOrderId,
                    CfPaymentId = tx.CfPaymentId,
                    Amount = tx.Amount,
                    Currency = tx.Currency,
                    PaymentMethod = order.PaymentMethod,
                    BankReference = tx.BankReference,
                    VerifiedAt = tx.VerifiedAt
                };
            }

            if (!IsConfigured())
            {
                return new CashfreePaymentVerificationResult
                {
                    Success = true,
                    IsPaid = false,
                    Status = tx.Status,
                    Message = "Gateway credentials not configured on server; returning local transaction status.",
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    CfOrderId = tx.CfOrderId,
                    Amount = tx.Amount,
                    Currency = tx.Currency
                };
            }

            try
            {
                var payments = await GetCashfreeOrderPaymentsAsync(tx.CfOrderId);
                var cfOrder = await GetCashfreeOrderAsync(tx.CfOrderId);

                var successfulPayment = payments?.FirstOrDefault(p =>
                    string.Equals(p.PaymentStatus, "SUCCESS", StringComparison.OrdinalIgnoreCase));

                bool isPaidAtGateway = successfulPayment != null ||
                    string.Equals(cfOrder?.OrderStatus, "PAID", StringComparison.OrdinalIgnoreCase);

                if (isPaidAtGateway)
                {
                    var paymentIdStr = successfulPayment?.CfPaymentId?.ToString() ?? "";
                    var paymentAmount = successfulPayment?.PaymentAmount ?? cfOrder?.OrderAmount ?? tx.Amount;

                    decimal expectedAmount = order.FinalAmount > 0 ? order.FinalAmount : order.TotalAmount;
                    long expectedPaise = (long)Math.Round(expectedAmount * 100m, MidpointRounding.AwayFromZero);
                    long receivedPaise = (long)Math.Round(paymentAmount * 100m, MidpointRounding.AwayFromZero);

                    if (expectedPaise != receivedPaise)
                    {
                        _logger.LogError("Payment amount mismatch in server verification! Expected: {ExpectedPaise} paise (INR {Expected:F2}), Received: {ReceivedPaise} paise (INR {Received:F2}).",
                            expectedPaise, expectedAmount, receivedPaise, paymentAmount);
                        tx.Status = "AmountMismatch";
                        tx.ErrorMessage = $"Received INR {paymentAmount:F2} ({receivedPaise} paise) but expected INR {expectedAmount:F2} ({expectedPaise} paise).";
                        tx.UpdatedAt = DateTime.UtcNow;
                        await _context.SaveChangesAsync();

                        return new CashfreePaymentVerificationResult
                        {
                            Success = false,
                            IsPaid = false,
                            Status = "AmountMismatch",
                            Message = "Payment amount does not match application order amount.",
                            OrderId = order.Id,
                            OrderNumber = order.OrderNumber
                        };
                    }

                    tx.Status = "Success";
                    tx.CfPaymentId = !string.IsNullOrWhiteSpace(paymentIdStr) ? paymentIdStr : tx.CfPaymentId;
                    tx.BankReference = successfulPayment?.BankReference ?? tx.BankReference;
                    tx.PaymentGroup = successfulPayment?.PaymentGroup ?? tx.PaymentGroup;
                    tx.VerifiedAt = DateTime.UtcNow;
                    tx.UpdatedAt = DateTime.UtcNow;

                    order.PaymentStatus = "Paid";
                    order.PaymentMethod = $"Cashfree ({successfulPayment?.PaymentGroup ?? "Online"})";
                    if (order.Status.Equals("Pending", StringComparison.OrdinalIgnoreCase))
                    {
                        order.Status = "Processing";
                    }
                    else if (order.Status.Equals("Expired", StringComparison.OrdinalIgnoreCase) ||
                             order.Status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
                    {
                        // Late payment confirmation for expired/cancelled reservation: Re-check inventory
                        bool stockAvailable = true;
                        await _context.Entry(order).Collection(o => o.Items).LoadAsync();
                        foreach (var item in order.Items)
                        {
                            var prod = await _context.Products.FindAsync(item.ProductId);
                            if (prod == null || prod.Stock < item.Quantity)
                            {
                                stockAvailable = false;
                                break;
                            }
                        }

                        if (stockAvailable)
                        {
                            foreach (var item in order.Items)
                            {
                                var prod = await _context.Products.FindAsync(item.ProductId);
                                if (prod != null) prod.Stock -= item.Quantity;
                            }
                            order.Status = "Processing";
                        }
                        else
                        {
                            order.Status = "RequiresReview";
                        }
                    }

                    _context.OrderTrackingLogs.Add(new OrderTrackingLog
                    {
                        OrderId = order.Id,
                        Status = order.Status,
                        Description = $"Payment of INR {order.FinalAmount:N2} verified via Cashfree Server API. Ref: {paymentIdStr}.",
                        CreatedAt = DateTime.UtcNow
                    });

                    _context.Notifications.Add(new Notification
                    {
                        Title = "Payment Verified",
                        Message = $"Payment of INR {order.FinalAmount:N2} verified for Order #{order.OrderNumber}.",
                        Type = "PaymentReceived"
                    });

                    await _context.SaveChangesAsync();

                    return new CashfreePaymentVerificationResult
                    {
                        Success = true,
                        IsPaid = true,
                        Status = "Paid",
                        Message = "Cashfree payment verified successfully.",
                        OrderId = order.Id,
                        OrderNumber = order.OrderNumber,
                        CfOrderId = tx.CfOrderId,
                        CfPaymentId = tx.CfPaymentId,
                        Amount = tx.Amount,
                        Currency = tx.Currency,
                        PaymentMethod = order.PaymentMethod,
                        BankReference = tx.BankReference,
                        VerifiedAt = tx.VerifiedAt
                    };
                }

                var failedPayment = payments?.FirstOrDefault(p =>
                    string.Equals(p.PaymentStatus, "FAILED", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(p.PaymentStatus, "USER_DROPPED", StringComparison.OrdinalIgnoreCase));

                if (failedPayment != null)
                {
                    tx.Status = string.Equals(failedPayment.PaymentStatus, "USER_DROPPED", StringComparison.OrdinalIgnoreCase) ? "UserDropped" : "Failed";
                    tx.ErrorMessage = failedPayment.PaymentMessage ?? "Payment was declined or cancelled.";
                    tx.UpdatedAt = DateTime.UtcNow;
                    order.PaymentStatus = "Failed";
                    await _context.SaveChangesAsync();

                    return new CashfreePaymentVerificationResult
                    {
                        Success = true,
                        IsPaid = false,
                        Status = tx.Status,
                        Message = tx.ErrorMessage,
                        OrderId = order.Id,
                        OrderNumber = order.OrderNumber,
                        CfOrderId = tx.CfOrderId,
                        Amount = tx.Amount,
                        Currency = tx.Currency
                    };
                }

                return new CashfreePaymentVerificationResult
                {
                    Success = true,
                    IsPaid = false,
                    Status = "Pending",
                    Message = "Payment is pending gateway confirmation.",
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    CfOrderId = tx.CfOrderId,
                    Amount = tx.Amount,
                    Currency = tx.Currency
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while verifying Cashfree payment status for Order {OrderNumber}.", order.OrderNumber);
                return new CashfreePaymentVerificationResult
                {
                    Success = true,
                    IsPaid = false,
                    Status = "Pending",
                    Message = "Payment gateway verification temporarily unavailable. Status will update once reconnected.",
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    CfOrderId = tx.CfOrderId,
                    Amount = tx.Amount,
                    Currency = tx.Currency
                };
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

        public async Task<int> ReleaseExpiredInventoryReservationsAsync(TimeSpan? reservationTimeout = null)
        {
            var timeout = reservationTimeout ?? TimeSpan.FromMinutes(60);
            var cutoff = DateTime.UtcNow.Subtract(timeout);
            var recentAttemptCutoff = DateTime.UtcNow.AddMinutes(-15);

            var expiredOrders = await _context.Orders
                .Include(o => o.Items)
                .Where(o => (o.Status == "Processing" || o.Status == "Pending") &&
                            o.PaymentStatus == "Pending" &&
                            o.PaymentMethod != null && o.PaymentMethod.Contains("Cashfree") &&
                            o.OrderDate < cutoff)
                .ToListAsync();

            int releasedCount = 0;
            foreach (var order in expiredOrders)
            {
                // Do not release stock while a payment attempt remains legitimately pending
                bool hasRecentAttempt = await _context.PaymentTransactions
                    .AnyAsync(t => t.OrderId == order.Id && t.CreatedAt > recentAttemptCutoff);

                if (hasRecentAttempt) continue;

                // Restore product stock safely
                foreach (var item in order.Items)
                {
                    var product = await _context.Products.FindAsync(item.ProductId);
                    if (product != null)
                    {
                        product.Stock += item.Quantity;
                    }
                }

                order.Status = "Expired";
                _context.OrderTrackingLogs.Add(new OrderTrackingLog
                {
                    OrderId = order.Id,
                    Status = "Expired",
                    Description = $"Inventory reservation expired after {timeout.TotalMinutes} minutes of unpaid inactivity. Stock released.",
                    CreatedAt = DateTime.UtcNow
                });

                releasedCount++;
            }

            if (releasedCount > 0)
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Released expired inventory reservations for {Count} orders.", releasedCount);
            }

            return releasedCount;
        }
    }
}
