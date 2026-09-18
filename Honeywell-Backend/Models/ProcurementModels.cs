using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Honeywell.Models
{
    public class PurchaseIndent
    {
        [Key]
        public int Id { get; set; }

        public string IndentNumber { get; set; } = string.Empty;
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public string RequestedBy { get; set; } = string.Empty;
        public string Warehouse { get; set; } = string.Empty;
        public string Priority { get; set; } = "High";
        public string Status { get; set; } = "Pending Approval";
        public string? Remarks { get; set; }
        public decimal TotalEstimatedCost { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<PurchaseIndentItem> Items { get; set; } = new();
    }

    public class PurchaseIndentItem
    {
        [Key]
        public int Id { get; set; }

        public int PurchaseIndentId { get; set; }
        public PurchaseIndent? PurchaseIndent { get; set; }

        public string ProductId { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string SKU { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal EstimatedCost { get; set; }
    }

    public class PurchaseOrder
    {
        [Key]
        public int Id { get; set; }

        public string PONumber { get; set; } = string.Empty;
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public int? IndentId { get; set; }
        public int SupplierId { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public string Warehouse { get; set; } = string.Empty;
        public string PaymentTerms { get; set; } = "Net 30";
        public DateTime ExpectedDeliveryDate { get; set; } = DateTime.UtcNow.AddDays(14);
        public string Status { get; set; } = "Issued";
        public string? Remarks { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<PurchaseOrderItem> Items { get; set; } = new();
    }

    public class PurchaseOrderItem
    {
        [Key]
        public int Id { get; set; }

        public int PurchaseOrderId { get; set; }
        public PurchaseOrder? PurchaseOrder { get; set; }

        public string ProductId { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
    }
}
