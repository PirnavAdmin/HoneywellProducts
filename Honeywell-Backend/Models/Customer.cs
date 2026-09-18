using System;
using System.Collections.Generic;

namespace Honeywell.Models
{
    public class Customer
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public GrowerUser? User { get; set; }

        public string? Name { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }
        public string? Role { get; set; } = "CUSTOMER ACCOUNT";
        public string? Status { get; set; } = "Active"; // Active, Inactive
        public DateTime JoinDate { get; set; } = DateTime.UtcNow;
        public int CoinsBalance { get; set; } = 0;

        public string? Gender { get; set; } = "Male";
        public string? CompanyOrganization { get; set; } = "Individual Account";

        public string? Address { get; set; }
        public string? District { get; set; }
        public string? State { get; set; }
        public string? ProfilePicture { get; set; }

        // Bank Account Information
        public string? AccountHolderName { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public string? IfscCode { get; set; }

        // UPI Payment Handle
        public string? UpiId { get; set; }

        // Structured Shipping & Billing JSON
        public string? ShippingAddressJson { get; set; }
        public string? BillingAddressJson { get; set; }

        // Navigation properties
        public CustomerAgrarian? AgrarianProfile { get; set; }
        public List<CustomerAdvisory> Advisories { get; set; } = new();
        public List<Order> Orders { get; set; } = new();
    }
}
