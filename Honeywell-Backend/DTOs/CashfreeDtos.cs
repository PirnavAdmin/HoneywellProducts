using System;
using System.Text.Json.Serialization;

namespace Honeywell.DTOs
{
    public class CreateCashfreePaymentOrderRequest
    {
        /// <summary>
        /// Numeric order ID (e.g. 5) or order number string (e.g. ORD-20261102-12345).
        /// </summary>
        public string OrderId { get; set; } = string.Empty;

        /// <summary>
        /// Optional client override for return URL. If omitted, default frontend template is used.
        /// </summary>
        public string? ReturnUrl { get; set; }

        /// <summary>
        /// Optional client override for webhook notification URL.
        /// </summary>
        public string? NotifyUrl { get; set; }

        /// <summary>
        /// Optional guest verification email if order was placed as guest.
        /// </summary>
        public string? CustomerEmail { get; set; }

        /// <summary>
        /// Optional guest verification phone if order was placed as guest.
        /// </summary>
        public string? CustomerPhone { get; set; }

        /// <summary>
        /// Optional idempotency key to prevent accidental duplicate submissions.
        /// </summary>
        public string? IdempotencyKey { get; set; }
    }

    public class CashfreeOrderCreationResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int OrderId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string CfOrderId { get; set; } = string.Empty;
        public string? PaymentSessionId { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "INR";
        public string Environment { get; set; } = "sandbox";
        public string Status { get; set; } = "Created";
        public string? ErrorCode { get; set; }
    }

    // --- Cashfree API v2026-01-01 / v2023-08-01 Serialization DTOs ---

    public class CashfreePgCustomerDetails
    {
        [JsonPropertyName("customer_id")]
        public string CustomerId { get; set; } = string.Empty;

        [JsonPropertyName("customer_name")]
        public string? CustomerName { get; set; }

        [JsonPropertyName("customer_email")]
        public string? CustomerEmail { get; set; }

        [JsonPropertyName("customer_phone")]
        public string CustomerPhone { get; set; } = string.Empty;
    }

    public class CashfreePgOrderMeta
    {
        [JsonPropertyName("return_url")]
        public string? ReturnUrl { get; set; }

        [JsonPropertyName("notify_url")]
        public string? NotifyUrl { get; set; }

        [JsonPropertyName("payment_methods")]
        public string? PaymentMethods { get; set; }
    }

    public class CashfreePgCreateOrderPayload
    {
        [JsonPropertyName("order_id")]
        public string OrderId { get; set; } = string.Empty;

        [JsonPropertyName("order_amount")]
        public decimal OrderAmount { get; set; }

        [JsonPropertyName("order_currency")]
        public string OrderCurrency { get; set; } = "INR";

        [JsonPropertyName("customer_details")]
        public CashfreePgCustomerDetails CustomerDetails { get; set; } = new();

        [JsonPropertyName("order_meta")]
        public CashfreePgOrderMeta? OrderMeta { get; set; }

        [JsonPropertyName("order_note")]
        public string? OrderNote { get; set; }
    }

    public class CashfreePgOrderResponse
    {
        [JsonPropertyName("cf_order_id")]
        public string? CfOrderId { get; set; }

        [JsonPropertyName("order_id")]
        public string? OrderId { get; set; }

        [JsonPropertyName("entity")]
        public string? Entity { get; set; }

        [JsonPropertyName("order_currency")]
        public string? OrderCurrency { get; set; }

        [JsonPropertyName("order_amount")]
        public decimal? OrderAmount { get; set; }

        [JsonPropertyName("order_status")]
        public string? OrderStatus { get; set; }

        [JsonPropertyName("payment_session_id")]
        public string? PaymentSessionId { get; set; }

        [JsonPropertyName("order_expiry_time")]
        public string? OrderExpiryTime { get; set; }

        [JsonPropertyName("message")]
        public string? Message { get; set; }

        [JsonPropertyName("code")]
        public string? Code { get; set; }

        [JsonPropertyName("type")]
        public string? Type { get; set; }
    }
}
