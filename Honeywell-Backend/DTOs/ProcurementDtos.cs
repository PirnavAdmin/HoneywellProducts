using System;
using System.Collections.Generic;

namespace Honeywell.DTOs
{
    // --- Purchase Indent DTOs ---
    public class PurchaseIndentDto
    {
        public int Id { get; set; }
        public string IndentNumber { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public string RequestedBy { get; set; } = string.Empty;
        public string Warehouse { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Remarks { get; set; }
        public decimal TotalEstimatedCost { get; set; }
        public string CreatedAt { get; set; } = string.Empty;
        public List<PurchaseIndentItemDto> Items { get; set; } = new();
    }

    public class PurchaseIndentItemDto
    {
        public string ProductId { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string Sku { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal EstimatedCost { get; set; }
    }

    public class CreatePurchaseIndentRequest
    {
        public string RequestedBy { get; set; } = string.Empty;
        public string Warehouse { get; set; } = string.Empty;
        public string Priority { get; set; } = "High";
        public string? Remarks { get; set; }
        public List<CreatePurchaseIndentItemRequest> Items { get; set; } = new();
    }

    public class CreatePurchaseIndentItemRequest
    {
        public string ProductId { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string Sku { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal EstimatedCost { get; set; }
    }

    public class UpdatePurchaseIndentStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }

    // --- Purchase Order DTOs ---
    public class PurchaseOrderDto
    {
        public int Id { get; set; }
        public string PoNumber { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public int? IndentId { get; set; }
        public int SupplierId { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public string Warehouse { get; set; } = string.Empty;
        public string PaymentTerms { get; set; } = string.Empty;
        public string ExpectedDeliveryDate { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Remarks { get; set; }
        public decimal TotalAmount { get; set; }
        public string CreatedAt { get; set; } = string.Empty;
        public List<PurchaseOrderItemDto> Items { get; set; } = new();
    }

    public class PurchaseOrderItemDto
    {
        public string ProductId { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
    }

    public class CreatePurchaseOrderRequest
    {
        public int SupplierId { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public int? IndentId { get; set; }
        public string Warehouse { get; set; } = string.Empty;
        public string PaymentTerms { get; set; } = "Net 30";
        public DateTime? ExpectedDeliveryDate { get; set; }
        public string? Remarks { get; set; }
        public List<CreatePurchaseOrderItemRequest> Items { get; set; } = new();
    }

    public class CreatePurchaseOrderItemRequest
    {
        public string ProductId { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
    }

    public class UpdatePurchaseOrderStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}
