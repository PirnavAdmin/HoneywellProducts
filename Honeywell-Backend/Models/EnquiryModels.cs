using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Honeywell.Models
{
    [Table("BulkQuoteRequests")]
    public class BulkQuoteRequest
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string? GstinNumber { get; set; }
        public string Mobile { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Product { get; set; } = "General bulk requirement";
        public int Quantity { get; set; } = 1;
        public string Requirement { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    [Table("ContactUsRequests")]
    public class ContactUsRequest
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Mobile { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Company { get; set; }
        public string EnquiryType { get; set; } = "General";
        public string Message { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    [Table("PartnerApplications")]
    public class PartnerApplication
    {
        [Key]
        public int Id { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string? GstinNumber { get; set; }
        public string ContactPerson { get; set; } = string.Empty;
        public string BusinessType { get; set; } = "Distributor";
        public string Mobile { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string? YearsInBusiness { get; set; }
        public string Address { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool AgreedToTerms { get; set; } = true;
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    [Table("ProductEnquiries")]
    public class ProductEnquiry
    {
        [Key]
        public int Id { get; set; }
        public string Product { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string MobileNumber { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class BulkQuoteRequestDto
    {
        public string Name { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string? GstinNumber { get; set; }
        public string? Gstin { get; set; }
        public string Mobile { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string? Product { get; set; }
        public object? Quantity { get; set; }
        public string? Requirement { get; set; }
        public string? Message { get; set; }
    }

    public class ContactUsRequestDto
    {
        public string Name { get; set; } = string.Empty;
        public string Mobile { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Company { get; set; }
        public string? EnquiryType { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class PartnerApplicationDto
    {
        public string CompanyName { get; set; } = string.Empty;
        public string? GstinNumber { get; set; }
        public string? Gstin { get; set; }
        public string ContactPerson { get; set; } = string.Empty;
        public string? BusinessType { get; set; }
        public string Mobile { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string? YearsInBusiness { get; set; }
        public string Address { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool? AgreedToTerms { get; set; }
    }

    public class ProductEnquiryDto
    {
        public string Product { get; set; } = string.Empty;
        public string? ProductName { get; set; }
        public string Name { get; set; } = string.Empty;
        public string MobileNumber { get; set; } = string.Empty;
        public string? Mobile { get; set; }
        public string? Email { get; set; }
    }
}
