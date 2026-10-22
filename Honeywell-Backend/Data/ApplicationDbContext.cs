
using Microsoft.EntityFrameworkCore;
using Honeywell.Models;

namespace Honeywell.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // Admin User Table
        public DbSet<User> Users { get; set; }

        // Cart
        public DbSet<CartItem> CartItems { get; set; }

        // Customer Address
        public DbSet<CustomerAddress> CustomerAddresses { get; set; }

        // Order Success
        public DbSet<OrderSuccess> OrderSuccesses { get; set; }

        // Catalog tables
        public DbSet<Product> Products { get; set; }
        public DbSet<ProductImage> ProductImages { get; set; }
        public DbSet<ProductVideo> ProductVideos { get; set; }
        public DbSet<ProductFeature> ProductFeatures { get; set; }
        public DbSet<ProductReview> ProductReviews { get; set; }
        public DbSet<ProductSoftware> ProductSoftware { get; set; }
        public DbSet<GrowthJourney> GrowthJourneys { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Subcategory> Subcategories { get; set; }
        public DbSet<Coupon> Coupons { get; set; }
        public DbSet<CoinsSettings> CoinsSettings { get; set; }
        public DbSet<Customer> Customers { get; set; }

        // Additional tables
        public DbSet<TestUser> TestUsers { get; set; }
        public DbSet<Banner> Banners { get; set; }
        public DbSet<Blog> Blogs { get; set; }
        public DbSet<Brand> Brands { get; set; }
        public DbSet<Offer> Offers { get; set; }
        public DbSet<Solution> Solutions { get; set; }
        public DbSet<GrowerUser> GrowerUsers { get; set; }
        public DbSet<CustomerAgrarian> CustomerAgrarians { get; set; }
        public DbSet<CustomerAdvisory> CustomerAdvisories { get; set; }
        public DbSet<Staff> Staff { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<SystemSettings> SystemSettings { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<WishlistItem> WishlistItems { get; set; }
        public DbSet<Testimonial> Testimonials { get; set; }
        public DbSet<WalletTransaction> WalletTransactions { get; set; }
        public DbSet<ManualPayment> ManualPayments { get; set; }
        public DbSet<BankDetailsConfig> BankDetailsConfigs { get; set; }
        public DbSet<UpiDetailsConfig> UpiDetailsConfigs { get; set; }
        public DbSet<QrCodeConfig> QrCodeConfigs { get; set; }
        public DbSet<SupportConfig> SupportConfigs { get; set; }
        public DbSet<SupportTicket> SupportTickets { get; set; }
        public DbSet<OrderTrackingLog> OrderTrackingLogs { get; set; }
        public DbSet<StockLedgerLog> StockLedgerLogs { get; set; }
        public DbSet<CallLog> CallLogs { get; set; }
        public DbSet<ReturnRequest> ReturnRequests { get; set; }
        public DbSet<ReturnEvidence> ReturnEvidences { get; set; }
        public DbSet<ReturnTimeline> ReturnTimelines { get; set; }
        public DbSet<ReturnPickup> ReturnPickups { get; set; }

        // Procurement tables
        public DbSet<PurchaseIndent> PurchaseIndents { get; set; }
        public DbSet<PurchaseIndentItem> PurchaseIndentItems { get; set; }
        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
        public DbSet<PurchaseOrderItem> PurchaseOrderItems { get; set; }

        // B2B Partner Portal and Dynamic Settings
        public DbSet<PartnerUser> PartnerUsers { get; set; }
        public DbSet<SystemConfig> SystemConfigs { get; set; }
        public DbSet<Distributor> Distributors { get; set; }
        public DbSet<PartnerProgram> PartnerPrograms { get; set; }

        // Enquiry and Form Submission tables
        public DbSet<BulkQuoteRequest> BulkQuoteRequests { get; set; }
        public DbSet<ContactUsRequest> ContactUsRequests { get; set; }
        public DbSet<PartnerApplication> PartnerApplications { get; set; }
        public DbSet<ProductEnquiry> ProductEnquiries { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // ReturnRequest unique constraint
            modelBuilder.Entity<ReturnRequest>()
                .HasIndex(r => r.OrderItemId)
                .IsUnique();

            // Wishlist table
            modelBuilder.Entity<WishlistItem>(entity =>
            {
                entity.ToTable("WishlistItems");

                entity.HasIndex(w => new
                {
                    w.UserPhone,
                    w.ProductId
                }).IsUnique();
            });

            // Existing table names
            modelBuilder.Entity<User>()
                .ToTable("admin_user");

            modelBuilder.Entity<CartItem>()
                .ToTable("CartItems");

            modelBuilder.Entity<CustomerAddress>()
                .ToTable("CustomerAddresses");

            modelBuilder.Entity<OrderSuccess>()
                .ToTable("order_success");

            modelBuilder.Entity<Testimonial>()
                .ToTable("Testimonials");

            modelBuilder.Entity<Order>()
                .ToTable("Orders");

            modelBuilder.Entity<OrderItem>()
                .ToTable("OrderItems");

            // Customer -> User (optional)
            modelBuilder.Entity<Customer>()
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            // Customer -> CustomerAgrarian (one-to-one)
            modelBuilder.Entity<Customer>()
                .HasOne(c => c.AgrarianProfile)
                .WithOne(a => a.Customer)
                .HasForeignKey<CustomerAgrarian>(a => a.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            // Customer -> CustomerAdvisory (one-to-many)
            modelBuilder.Entity<Customer>()
                .HasMany(c => c.Advisories)
                .WithOne(a => a.Customer)
                .HasForeignKey(a => a.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            // CustomerAdvisory -> Staff
            modelBuilder.Entity<CustomerAdvisory>()
                .HasOne(a => a.Staff)
                .WithMany()
                .HasForeignKey(a => a.StaffId)
                .OnDelete(DeleteBehavior.Restrict);

            // Customer -> Order
            modelBuilder.Entity<Customer>()
                .HasMany(c => c.Orders)
                .WithOne(o => o.Customer)
                .HasForeignKey(o => o.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Order -> OrderItem
            modelBuilder.Entity<Order>()
                .HasMany(o => o.Items)
                .WithOne(i => i.Order)
                .HasForeignKey(i => i.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            // Product -> ProductImage
            modelBuilder.Entity<ProductImage>()
                .HasOne<Product>()
                .WithMany(p => p.Images)
                .HasForeignKey(pi => pi.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            // Product -> ProductVideo
            modelBuilder.Entity<ProductVideo>()
                .HasOne<Product>()
                .WithMany(p => p.Videos)
                .HasForeignKey(pv => pv.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            // Product -> ProductFeature
            modelBuilder.Entity<ProductFeature>()
                .HasOne<Product>()
                .WithMany(p => p.Features)
                .HasForeignKey(pf => pf.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            // Product -> ProductReview
            modelBuilder.Entity<ProductReview>()
                .HasOne<Product>()
                .WithMany(p => p.Reviews)
                .HasForeignKey(pr => pr.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            // ProductSoftware
            modelBuilder.Entity<ProductSoftware>(entity =>
            {
                entity.ToTable("ProductSoftware");

                entity.HasOne(s => s.Product)
                    .WithMany(p => p.SoftwareList)
                    .HasForeignKey(s => s.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(s => s.ProductId);
                entity.HasIndex(s => s.Status);
                entity.HasIndex(s => s.SoftwareType);
                entity.HasIndex(s => s.Platform);
            });

            // Product table and decimal precision
            modelBuilder.Entity<Product>(entity =>
            {
                entity.ToTable("Products");

                entity.Property(p => p.MRP)
                    .HasPrecision(18, 2);

                entity.Property(p => p.BasePrice)
                    .HasPrecision(65, 30);

                entity.Property(p => p.CostPrice)
                    .HasPrecision(18, 2);

                entity.Property(p => p.DiscountAmount)
                    .HasPrecision(65, 30);

                entity.Property(p => p.SellingPrice)
                    .HasPrecision(65, 30);

                entity.Property(p => p.AverageRating)
                    .HasPrecision(5, 2);
            });

            // Coupon precision
            modelBuilder.Entity<Coupon>()
                .Property(c => c.DiscountValue)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Coupon>()
                .Property(c => c.MinCartValue)
                .HasPrecision(18, 2);

            // Coins settings precision
            modelBuilder.Entity<CoinsSettings>()
                .Property(c => c.ConversionRate)
                .HasPrecision(18, 4);

            modelBuilder.Entity<CoinsSettings>()
                .Property(c => c.EarnRate)
                .HasPrecision(18, 4);

            // Order precision
            modelBuilder.Entity<Order>()
                .Property(o => o.TotalAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Order>()
                .Property(o => o.DiscountAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Order>()
                .Property(o => o.ShippingFee)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Order>()
                .Property(o => o.GstAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Order>()
                .Property(o => o.FinalAmount)
                .HasPrecision(18, 2);

            // OrderItem precision
            modelBuilder.Entity<OrderItem>()
                .Property(i => i.Price)
                .HasPrecision(18, 2);

            modelBuilder.Entity<OrderItem>()
                .Property(i => i.Subtotal)
                .HasPrecision(18, 2);

            // System settings precision
            modelBuilder.Entity<SystemSettings>()
                .Property(s => s.GstPercentage)
                .HasPrecision(18, 2);

            modelBuilder.Entity<SystemSettings>()
                .Property(s => s.FlatShippingFee)
                .HasPrecision(18, 2);

            // Purchase Indent
            modelBuilder.Entity<PurchaseIndent>(entity =>
            {
                entity.ToTable("PurchaseIndents");

                entity.Property(p => p.TotalEstimatedCost)
                    .HasPrecision(18, 2);

                entity.HasMany(p => p.Items)
                    .WithOne(i => i.PurchaseIndent)
                    .HasForeignKey(i => i.PurchaseIndentId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Purchase Indent Item
            modelBuilder.Entity<PurchaseIndentItem>(entity =>
            {
                entity.ToTable("PurchaseIndentItems");

                entity.Property(i => i.EstimatedCost)
                    .HasPrecision(18, 2);
            });

            // Purchase Order
            modelBuilder.Entity<PurchaseOrder>(entity =>
            {
                entity.ToTable("PurchaseOrders");

                entity.Property(p => p.TotalAmount)
                    .HasPrecision(18, 2);

                entity.HasMany(p => p.Items)
                    .WithOne(i => i.PurchaseOrder)
                    .HasForeignKey(i => i.PurchaseOrderId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Purchase Order Item
            modelBuilder.Entity<PurchaseOrderItem>(entity =>
            {
                entity.ToTable("PurchaseOrderItems");

                entity.Property(i => i.UnitPrice)
                    .HasPrecision(18, 2);
            });

            base.OnModelCreating(modelBuilder);
        }
    }
}
