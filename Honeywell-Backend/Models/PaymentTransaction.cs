using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Honeywell.Models
{
    [Table("payment_transactions")]
    public class PaymentTransaction
    {
        [Key]
        public int Id { get; set; }

        public int OrderId { get; set; }

        [Required]
        [MaxLength(100)]
        public string OrderNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Gateway { get; set; } = "Cashfree";

        [Required]
        [MaxLength(100)]
        public string CfOrderId { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? PaymentSessionId { get; set; }

        [MaxLength(100)]
        public string? CfPaymentId { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        [MaxLength(10)]
        public string Currency { get; set; } = "INR";

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Created"; // Created, Pending, Success, Failed, Cancelled

        public int? CustomerId { get; set; }

        [MaxLength(150)]
        public string? CustomerName { get; set; }

        [MaxLength(150)]
        public string? CustomerEmail { get; set; }

        [MaxLength(50)]
        public string? CustomerPhone { get; set; }

        [MaxLength(100)]
        public string? PaymentMethod { get; set; }

        [MaxLength(100)]
        public string? IdempotencyKey { get; set; }

        public string? ErrorMessage { get; set; }

        public string? RawResponse { get; set; }

        [MaxLength(100)]
        public string? BankReference { get; set; }

        [MaxLength(50)]
        public string? PaymentGroup { get; set; }

        public DateTime? VerifiedAt { get; set; }

        public DateTime? WebhookProcessedAt { get; set; }

        [MaxLength(100)]
        public string? WebhookEventType { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}
