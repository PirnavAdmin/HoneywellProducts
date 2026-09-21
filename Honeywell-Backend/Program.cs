using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using Honeywell.Data;
using Honeywell.Repositories;
using Honeywell.Repositories.Interfaces;
using Honeywell.Services;
using Honeywell.Services.Interfaces;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Memory Cache & Response Compression (Brotli & Gzip)
builder.Services.AddMemoryCache();
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});

// Add Controllers & ignore JSON reference cycles
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// Configure FormOptions for 50MB file uploads
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 52428800; // 50 MB
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartHeadersLengthLimit = int.MaxValue;
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "Honeywell API", Version = "v1" });
    c.CustomSchemaIds(type => type.FullName);
    c.ResolveConflictingActions(apiDescriptions => apiDescriptions.First());
    
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below. Example: 'Bearer 12345abcdef'",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod()
              .WithExposedHeaders("Authorization", "Content-Type", "ngrok-skip-browser-warning");
    });
});

// Database (Using hardcoded MySQL version to avoid extra startup connection quota consumption)
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        new MySqlServerVersion(new Version(10, 6, 0)),
        mysqlOptions =>
        {
            mysqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
            mysqlOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(5),
                errorNumbersToAdd: null);
        }));

// Repositories
builder.Services.AddScoped<ITestUserRepository, TestUserRepository>();
builder.Services.AddScoped<IBlogRepository, BlogRepository>();

// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ITestAuthService, TestAuthService>();
builder.Services.AddScoped<IBlogService, BlogService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IProductSoftwareService, ProductSoftwareService>();

// JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    builder.Configuration["Jwt:Key"]))
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// Database Schema Initializer (Ensure WalletTransactions and expanded CoinsSettings exist)
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var conn = context.Database.GetDbConnection();
    bool wasClosed = conn.State != System.Data.ConnectionState.Open;
    try
    {
        context.Database.EnsureCreated();
        if (wasClosed)
        {
            conn.Open();
        }

        // 0. Ensure admin_user table exists and seed requested Admin User
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `admin_user` (
                    `Email` VARCHAR(255) PRIMARY KEY,
                    `Password` VARCHAR(255) NOT NULL,
                    `Role` VARCHAR(100) NOT NULL,
                    `Otp` VARCHAR(50) NULL,
                    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
                    `CreatedDate` DATETIME NOT NULL,
                    `FullName` VARCHAR(200) NULL,
                    `MobileNumber` VARCHAR(50) NULL,
                    `EmployeeId` VARCHAR(100) NULL,
                    `PermissionsJson` TEXT NULL
                );";
            cmd.ExecuteNonQuery();

            // Ensure PermissionsJson column exists
            try
            {
                cmd.CommandText = "ALTER TABLE `admin_user` ADD COLUMN `PermissionsJson` TEXT NULL;";
                cmd.ExecuteNonQuery();
            }
            catch { }

            // Ensure Product Specification columns exist
            try { cmd.CommandText = "ALTER TABLE `Products` ADD COLUMN `Weight` VARCHAR(100) NULL;"; cmd.ExecuteNonQuery(); } catch { }
            try { cmd.CommandText = "ALTER TABLE `Products` ADD COLUMN `Dimensions` VARCHAR(100) NULL;"; cmd.ExecuteNonQuery(); } catch { }
            try { cmd.CommandText = "ALTER TABLE `Products` ADD COLUMN `PowerSource` VARCHAR(100) NULL;"; cmd.ExecuteNonQuery(); } catch { }
            try { cmd.CommandText = "ALTER TABLE `Products` ADD COLUMN `Material` VARCHAR(100) NULL;"; cmd.ExecuteNonQuery(); } catch { }
            try { cmd.CommandText = "ALTER TABLE `Products` ADD COLUMN `CoverageUsage` VARCHAR(250) NULL;"; cmd.ExecuteNonQuery(); } catch { }
            try { cmd.CommandText = "ALTER TABLE `Products` ADD COLUMN `Specifications` TEXT NULL;"; cmd.ExecuteNonQuery(); } catch { }
            try { cmd.CommandText = "ALTER TABLE `ProductReviews` MODIFY COLUMN `Rating` DECIMAL(5,2) NOT NULL DEFAULT 5.00;"; cmd.ExecuteNonQuery(); } catch { }
            try { cmd.CommandText = "ALTER TABLE `ProductReviews` ADD COLUMN `Status` VARCHAR(50) NOT NULL DEFAULT 'Approved';"; cmd.ExecuteNonQuery(); } catch { }
            try { cmd.CommandText = "ALTER TABLE `ProductReviews` ADD COLUMN `CreatedAt` DATETIME NOT NULL DEFAULT NOW();"; cmd.ExecuteNonQuery(); } catch { }
            try { cmd.CommandText = "ALTER TABLE `ProductReviews` ADD COLUMN `UpdatedAt` DATETIME NULL;"; cmd.ExecuteNonQuery(); } catch { }

            cmd.CommandText = "SELECT COUNT(*) FROM `admin_user` WHERE LOWER(`Email`) = 'bhargavakurapati49@gmail.com';";
            int adminCount = Convert.ToInt32(cmd.ExecuteScalar());
            if (adminCount == 0)
            {
                cmd.CommandText = @"
                    INSERT INTO `admin_user` (`Email`, `Password`, `Role`, `IsActive`, `CreatedDate`, `FullName`)
                    VALUES ('bhargavakurapati49@gmail.com', 'Bhargava@123', 'SuperAdmin', 1, NOW(), 'Bhargava Admin');";
                cmd.ExecuteNonQuery();
            }
            else
            {
                cmd.CommandText = @"
                    UPDATE `admin_user` 
                    SET `Password` = 'Bhargava@123', `Role` = 'SuperAdmin', `IsActive` = 1
                    WHERE LOWER(`Email`) = 'bhargavakurapati49@gmail.com';";
                cmd.ExecuteNonQuery();
            }

            // Create PartnerUsers table
            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `PartnerUsers` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `CompanyName` VARCHAR(200) NOT NULL,
                    `ContactPerson` VARCHAR(200) NOT NULL,
                    `Email` VARCHAR(200) NOT NULL,
                    `Phone` VARCHAR(50) NOT NULL,
                    `Password` VARCHAR(255) NOT NULL,
                    `Gstin` VARCHAR(100) NOT NULL,
                    `PartnerType` VARCHAR(100) NOT NULL DEFAULT 'Distributor',
                    `Status` VARCHAR(50) NOT NULL DEFAULT 'Active',
                    `TotalCommissionEarned` DECIMAL(18,2) NOT NULL DEFAULT 0,
                    `TotalOrdersPlaced` INT NOT NULL DEFAULT 0,
                    `CreatedAt` DATETIME NOT NULL
                );";
            cmd.ExecuteNonQuery();

            // Create SystemConfigs table
            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `SystemConfigs` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `Key` VARCHAR(100) NOT NULL UNIQUE,
                    `JsonValue` LONGTEXT NOT NULL,
                    `UpdatedAt` DATETIME NOT NULL
                );";
            cmd.ExecuteNonQuery();

            // Create GrowthJourneys table & seed baseline metrics
            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `GrowthJourneys` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `Year` VARCHAR(20) NOT NULL UNIQUE,
                    `Business` DOUBLE NOT NULL DEFAULT 0,
                    `Products` DOUBLE NOT NULL DEFAULT 0,
                    `Customers` DOUBLE NOT NULL DEFAULT 0,
                    `Sales` DOUBLE NOT NULL DEFAULT 0,
                    `UpdatedAt` DATETIME NOT NULL
                );";
            cmd.ExecuteNonQuery();

            cmd.CommandText = "SELECT COUNT(*) FROM `GrowthJourneys`;";
            int growthCount = Convert.ToInt32(cmd.ExecuteScalar());
            if (growthCount == 0)
            {
                cmd.CommandText = @"
                    INSERT INTO `GrowthJourneys` (`Year`, `Business`, `Products`, `Customers`, `Sales`, `UpdatedAt`) VALUES
                    ('2022', 20, 15, 24, 18, NOW()),
                    ('2023', 30, 28, 34, 29, NOW()),
                    ('2024', 45, 43, 47, 42, NOW()),
                    ('2025', 60, 59, 63, 58, NOW()),
                    ('2026', 80, 78, 82, 76, NOW());";
                cmd.ExecuteNonQuery();
            }
        }

        // 1. Create WalletTransactions table
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `WalletTransactions` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `CustomerId` INT NOT NULL,
                    `Type` VARCHAR(50) NOT NULL,
                    `Source` VARCHAR(50) NOT NULL,
                    `Title` VARCHAR(150) NOT NULL,
                    `Description` TEXT NOT NULL,
                    `Coins` INT NOT NULL,
                    `OrderId` VARCHAR(100) NULL,
                    `CreatedDate` DATETIME NOT NULL,
                    `ExpiresAt` DATETIME NULL
                );";
            cmd.ExecuteNonQuery();
        }

        // 2. Query columns in CoinsSettings
        var existingCoinsCols = new List<string>();
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SHOW COLUMNS FROM `CoinsSettings`;";
            using (var reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    existingCoinsCols.Add(reader["Field"].ToString().ToLower());
                }
            }
        }

        var colsToEnsure = new Dictionary<string, string>
        {
            { "RupeesRequiredForOneCoin", "INT NOT NULL DEFAULT 20" },
            { "MinimumOrderValue", "DECIMAL(18,2) NOT NULL DEFAULT 100.00" },
            { "MaxCartRedeemPercent", "DECIMAL(18,2) NOT NULL DEFAULT 20.00" },
            { "WelcomeBonusCoins", "INT NOT NULL DEFAULT 25" },
            { "CoinValidityDays", "INT NOT NULL DEFAULT 180" },
            { "IsWelcomeBonusEnabled", "TINYINT(1) NOT NULL DEFAULT 1" },
            { "IsActive", "TINYINT(1) NOT NULL DEFAULT 1" }
        };

        foreach (var c in colsToEnsure)
        {
            if (!existingCoinsCols.Contains(c.Key.ToLower()))
            {
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = $"ALTER TABLE `CoinsSettings` ADD COLUMN `{c.Key}` {c.Value};";
                    cmd.ExecuteNonQuery();
                }
            }
        }

        // 3. Ensure at least one default row in CoinsSettings
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT COUNT(*) FROM `CoinsSettings`;";
            int count = Convert.ToInt32(cmd.ExecuteScalar());
            if (count == 0)
            {
                cmd.CommandText = @"
                    INSERT INTO `CoinsSettings` (
                        `ConversionRate`, `EarnRate`, `MinRedeemableCoins`, `MaxRedeemableCoins`, 
                        `RupeesRequiredForOneCoin`, `MinimumOrderValue`, `MaxCartRedeemPercent`, 
                        `WelcomeBonusCoins`, `CoinValidityDays`, `IsWelcomeBonusEnabled`, `IsActive`
                    ) VALUES (
                        1.00, 0.05, 100, 5000, 
                        20, 100.00, 20.00, 
                        25, 180, 1, 1
                    );";
                cmd.ExecuteNonQuery();
            }
        }

        // 3.5 Create ManualPayments table if it does not exist
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `ManualPayments` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `OrderId` VARCHAR(100) NOT NULL,
                    `UtrNumber` VARCHAR(100) NOT NULL,
                    `AmountPaid` DECIMAL(18,2) NOT NULL,
                    `PaymentDate` VARCHAR(50) NOT NULL,
                    `PaymentTime` VARCHAR(50) NOT NULL,
                    `CustomerName` VARCHAR(200) NOT NULL,
                    `MobileNumber` VARCHAR(50) NOT NULL,
                    `Remarks` TEXT NULL,
                    `ScreenshotUrl` VARCHAR(500) NULL,
                    `VerificationStatus` VARCHAR(50) NOT NULL DEFAULT 'Pending',
                    `SubmittedAt` DATETIME NOT NULL
                );";
            cmd.ExecuteNonQuery();
        }

        // 3.6 Create BankDetailsConfigs, UpiDetailsConfigs, and QrCodeConfigs tables if they do not exist
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `BankDetailsConfigs` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `IfscCode` VARCHAR(100) NOT NULL,
                    `BankName` VARCHAR(200) NOT NULL,
                    `Branch` VARCHAR(200) NOT NULL,
                    `AccountNumber` VARCHAR(100) NOT NULL,
                    `AccountHolderName` VARCHAR(200) NOT NULL,
                    `UpdatedAt` DATETIME NOT NULL
                );";
            cmd.ExecuteNonQuery();

            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `UpiDetailsConfigs` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `MerchantUpiId` VARCHAR(200) NOT NULL,
                    `MerchantName` VARCHAR(200) NOT NULL,
                    `BankDisplayName` VARCHAR(200) NOT NULL,
                    `Currency` VARCHAR(50) NOT NULL DEFAULT 'INR',
                    `UpdatedAt` DATETIME NOT NULL
                );";
            cmd.ExecuteNonQuery();

            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `QrCodeConfigs` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `QrImageUrl` VARCHAR(500) NOT NULL,
                    `UpdatedAt` DATETIME NOT NULL
                );";
            cmd.ExecuteNonQuery();

            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `ProductSoftware` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `ProductId` INT NOT NULL,
                    `SoftwareName` VARCHAR(200) NOT NULL,
                    `Description` TEXT NOT NULL,
                    `SoftwareType` VARCHAR(100) NOT NULL,
                    `Version` VARCHAR(50) NOT NULL,
                    `Platform` VARCHAR(100) NOT NULL,
                    `Architecture` VARCHAR(50) NULL,
                    `FileUrl` VARCHAR(500) NULL,
                    `ExternalUrl` VARCHAR(500) NULL,
                    `OriginalFileName` VARCHAR(255) NULL,
                    `StoredFileName` VARCHAR(255) NULL,
                    `FileSize` BIGINT NULL,
                    `MimeType` VARCHAR(100) NULL,
                    `ReleaseDate` DATETIME NOT NULL,
                    `ReleaseNotes` TEXT NULL,
                    `MinimumRequirements` TEXT NULL,
                    `Status` VARCHAR(20) NOT NULL DEFAULT 'Active',
                    `IsFeatured` TINYINT(1) NOT NULL DEFAULT 0,
                    `SortOrder` INT NOT NULL DEFAULT 0,
                    `DownloadCount` INT NOT NULL DEFAULT 0,
                    `CreatedAt` DATETIME NOT NULL,
                    `UpdatedAt` DATETIME NULL,
                    `CreatedBy` VARCHAR(100) NULL,
                    `UpdatedBy` VARCHAR(100) NULL,
                    CONSTRAINT `FK_ProductSoftware_Products_ProductId` FOREIGN KEY (`ProductId`) REFERENCES `Products` (`Id`) ON DELETE CASCADE,
                    INDEX `IX_ProductSoftware_ProductId` (`ProductId`),
                    INDEX `IX_ProductSoftware_Status` (`Status`),
                    INDEX `IX_ProductSoftware_SoftwareType` (`SoftwareType`),
                    INDEX `IX_ProductSoftware_Platform` (`Platform`)
                );";
            cmd.ExecuteNonQuery();

            // Seed sample ProductSoftware items if empty
            cmd.CommandText = "SELECT COUNT(*) FROM `ProductSoftware`;";
            int softwareCount = Convert.ToInt32(cmd.ExecuteScalar());
            if (softwareCount == 0)
            {
                cmd.CommandText = "SELECT Id FROM `Products` LIMIT 1;";
                object? firstProdObj = cmd.ExecuteScalar();
                int prodId = firstProdObj != null && firstProdObj != DBNull.Value ? Convert.ToInt32(firstProdObj) : 1;

                cmd.CommandText = $@"
                    INSERT INTO `ProductSoftware` (
                        `ProductId`, `SoftwareName`, `Description`, `SoftwareType`, `Version`, `Platform`, `Architecture`, `ExternalUrl`, `ReleaseDate`, `ReleaseNotes`, `MinimumRequirements`, `Status`, `IsFeatured`, `SortOrder`, `DownloadCount`, `CreatedAt`
                    ) VALUES 
                    (
                        {prodId}, 'Honeywell Device Manager', 'Utility tool for configuring IP cameras, NVRs, and access controllers across local network.', 'Configuration Tool', '2.4.1', 'Windows', '64-bit', 'https://www.honeywell.com/downloads/device-manager-v2.4.1.exe', NOW(), 'Improved device discovery and batch configuration features.', 'Windows 10 or later, 4GB RAM', 'Active', 1, 1, 142, NOW()
                    ),
                    (
                        {prodId}, 'Honeywell IP Camera Firmware Update', 'Latest firmware release with security updates and ONVIF Profile T support.', 'Firmware', '1.8.4', 'Firmware', 'ARM', 'https://www.honeywell.com/downloads/camera-firmware-v1.8.4.bin', NOW(), 'Critical security patches and enhanced night-vision performance.', 'Compatible Honeywell IP Cameras', 'Active', 1, 2, 89, NOW()
                    ),
                    (
                        {prodId}, 'Honeywell Access Control SDK & API', 'Developer SDK for integrating Honeywell Access Control panels with third-party software.', 'SDK & API', '3.1.0', 'Cross-Platform', '64-bit', 'https://www.honeywell.com/downloads/access-control-sdk-v3.1.0.zip', NOW(), 'Added REST API wrapper and WebSocket event listener sample code.', 'NET 8.0, C# or C++ support', 'Active', 0, 3, 56, NOW()
                    ),
                    (
                        {prodId}, 'Honeywell Smart Scanner USB Driver', 'Official WHQL driver package for Honeywell barcode scanners and POS terminals.', 'Driver', '4.0.2', 'Windows', '32-bit/64-bit', 'https://www.honeywell.com/downloads/scanner-driver-v4.0.2.exe', NOW(), 'WHQL Windows 11 certified driver.', 'Windows 8.1/10/11', 'Active', 1, 4, 310, NOW()
                    );";
                cmd.ExecuteNonQuery();
            }
        }

        // 3.7 Ensure extra columns exist in Suppliers table
        var existingSupplierCols = new List<string>();
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SHOW COLUMNS FROM `Suppliers`;";
            using (var reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    existingSupplierCols.Add(reader["Field"].ToString().ToLower());
                }
            }
        }

        var supplierColsToEnsure = new System.Collections.Generic.Dictionary<string, string>
        {
            { "Gstin", "VARCHAR(100) NULL" },
            { "ProductCategory", "VARCHAR(200) NULL" },
            { "TrackingId", "VARCHAR(50) NULL" },
            { "Status", "VARCHAR(50) NOT NULL DEFAULT 'Pending'" },
            { "City", "VARCHAR(100) NULL" },
            { "LeadTime", "VARCHAR(100) NULL" }
        };

        foreach (var c in supplierColsToEnsure)
        {
            if (!existingSupplierCols.Contains(c.Key.ToLower()))
            {
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = $"ALTER TABLE `Suppliers` ADD COLUMN `{c.Key}` {c.Value};";
                    cmd.ExecuteNonQuery();
                }
            }
        }

        // 3.7.5 Create Procurement tables if they do not exist
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `PurchaseIndents` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `IndentNumber` VARCHAR(100) NOT NULL,
                    `Date` DATETIME NOT NULL,
                    `RequestedBy` VARCHAR(200) NOT NULL,
                    `Warehouse` VARCHAR(200) NOT NULL,
                    `Priority` VARCHAR(50) NOT NULL DEFAULT 'High',
                    `Status` VARCHAR(50) NOT NULL DEFAULT 'Pending Approval',
                    `Remarks` TEXT NULL,
                    `TotalEstimatedCost` DECIMAL(18,2) NOT NULL DEFAULT 0,
                    `CreatedAt` DATETIME NOT NULL
                );";
            cmd.ExecuteNonQuery();

            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `PurchaseIndentItems` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `PurchaseIndentId` INT NOT NULL,
                    `ProductId` VARCHAR(100) NOT NULL,
                    `ProductName` VARCHAR(250) NOT NULL,
                    `SKU` VARCHAR(100) NOT NULL,
                    `Quantity` INT NOT NULL,
                    `EstimatedCost` DECIMAL(18,2) NOT NULL,
                    CONSTRAINT `FK_PurchaseIndentItems_PurchaseIndents_PurchaseIndentId` FOREIGN KEY (`PurchaseIndentId`) REFERENCES `PurchaseIndents` (`Id`) ON DELETE CASCADE
                );";
            cmd.ExecuteNonQuery();

            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `PurchaseOrders` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `PONumber` VARCHAR(100) NOT NULL,
                    `Date` DATETIME NOT NULL,
                    `IndentId` INT NULL,
                    `SupplierId` INT NOT NULL,
                    `SupplierName` VARCHAR(200) NOT NULL,
                    `Warehouse` VARCHAR(200) NOT NULL,
                    `PaymentTerms` VARCHAR(100) NOT NULL DEFAULT 'Net 30',
                    `ExpectedDeliveryDate` DATETIME NOT NULL,
                    `Status` VARCHAR(50) NOT NULL DEFAULT 'Issued',
                    `Remarks` TEXT NULL,
                    `TotalAmount` DECIMAL(18,2) NOT NULL DEFAULT 0,
                    `CreatedAt` DATETIME NOT NULL
                );";
            cmd.ExecuteNonQuery();

            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `PurchaseOrderItems` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `PurchaseOrderId` INT NOT NULL,
                    `ProductId` VARCHAR(100) NOT NULL,
                    `ProductName` VARCHAR(250) NOT NULL,
                    `UnitPrice` DECIMAL(18,2) NOT NULL,
                    `Quantity` INT NOT NULL,
                    CONSTRAINT `FK_PurchaseOrderItems_PurchaseOrders_PurchaseOrderId` FOREIGN KEY (`PurchaseOrderId`) REFERENCES `PurchaseOrders` (`Id`) ON DELETE CASCADE
                );";
            cmd.ExecuteNonQuery();
        }

        // 3.8 Create SupportConfigs and SupportTickets tables if they do not exist
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `SupportConfigs` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `SupportPhoneNumber` VARCHAR(50) NOT NULL,
                    `WorkTimings` VARCHAR(150) NOT NULL,
                    `SupportEmail` VARCHAR(150) NOT NULL,
                    `UpdatedAt` DATETIME NOT NULL
                );";
            cmd.ExecuteNonQuery();

            // Seed default row if SupportConfigs is empty
            cmd.CommandText = "SELECT COUNT(*) FROM `SupportConfigs`;";
            int supportConfigCount = Convert.ToInt32(cmd.ExecuteScalar());
            if (supportConfigCount == 0)
            {
                cmd.CommandText = @"
                    INSERT INTO `SupportConfigs` (
                        `SupportPhoneNumber`, `WorkTimings`, `SupportEmail`, `UpdatedAt`
                    ) VALUES (
                        '+1 (800) 323-0194', 'Mon-Sat: 9:00 AM - 6:00 PM', 'support@honeywell.com', NOW()
                    );";
                cmd.ExecuteNonQuery();
            }
            else
            {
                // Update existing row if it contains legacy shyamagro data or empty strings
                cmd.CommandText = @"
                    UPDATE `SupportConfigs`
                    SET `SupportEmail` = 'support@honeywell.com',
                        `SupportPhoneNumber` = '+1 (800) 323-0194',
                        `WorkTimings` = 'Mon-Sat: 9:00 AM - 6:00 PM',
                        `UpdatedAt` = NOW()
                    WHERE LOWER(`SupportEmail`) LIKE '%shyamagro%' OR `SupportEmail` = '';";
                cmd.ExecuteNonQuery();
            }

            // Auto-seed or update BankDetailsConfigs
            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `BankDetailsConfigs` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `AccountHolderName` VARCHAR(200) NOT NULL,
                    `BankName` VARCHAR(150) NOT NULL,
                    `AccountNumber` VARCHAR(100) NOT NULL,
                    `IfscCode` VARCHAR(50) NOT NULL,
                    `Branch` VARCHAR(150) NOT NULL,
                    `UpdatedAt` DATETIME NOT NULL
                );";
            cmd.ExecuteNonQuery();

            cmd.CommandText = "SELECT COUNT(*) FROM `BankDetailsConfigs`;";
            int bankConfigCount = Convert.ToInt32(cmd.ExecuteScalar());
            if (bankConfigCount == 0)
            {
                cmd.CommandText = @"
                    INSERT INTO `BankDetailsConfigs` (
                        `AccountHolderName`, `BankName`, `AccountNumber`, `IfscCode`, `Branch`, `UpdatedAt`
                    ) VALUES (
                        'Honeywell Products & Solutions Pvt Ltd', 'HDFC Bank', '50200088991122', 'HDFC0000123', 'Cyber City Branch', NOW()
                    );";
                cmd.ExecuteNonQuery();
            }
            else
            {
                cmd.CommandText = @"
                    UPDATE `BankDetailsConfigs`
                    SET `AccountHolderName` = 'Honeywell Products & Solutions Pvt Ltd',
                        `BankName` = 'HDFC Bank',
                        `AccountNumber` = '50200088991122',
                        `IfscCode` = 'HDFC0000123',
                        `Branch` = 'Cyber City Branch',
                        `UpdatedAt` = NOW()
                    WHERE LOWER(`AccountHolderName`) LIKE '%agro%' OR LOWER(`AccountHolderName`) LIKE '%shyam%' OR `AccountNumber` = '123456789012';";
                cmd.ExecuteNonQuery();
            }

            // Auto-seed or update UpiDetailsConfigs
            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `UpiDetailsConfigs` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `MerchantName` VARCHAR(200) NOT NULL,
                    `MerchantUpiId` VARCHAR(150) NOT NULL,
                    `BankDisplayName` VARCHAR(150) NOT NULL,
                    `Currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
                    `UpdatedAt` DATETIME NOT NULL
                );";
            cmd.ExecuteNonQuery();

            cmd.CommandText = "SELECT COUNT(*) FROM `UpiDetailsConfigs`;";
            int upiConfigCount = Convert.ToInt32(cmd.ExecuteScalar());
            if (upiConfigCount == 0)
            {
                cmd.CommandText = @"
                    INSERT INTO `UpiDetailsConfigs` (
                        `MerchantName`, `MerchantUpiId`, `BankDisplayName`, `Currency`, `UpdatedAt`
                    ) VALUES (
                        'Honeywell Products India', 'honeywell@hdfcbank', 'HDFC Bank - Corporate', 'INR', NOW()
                    );";
                cmd.ExecuteNonQuery();
            }
            else
            {
                cmd.CommandText = @"
                    UPDATE `UpiDetailsConfigs`
                    SET `MerchantName` = 'Honeywell Products India',
                        `MerchantUpiId` = 'honeywell@hdfcbank',
                        `BankDisplayName` = 'HDFC Bank - Corporate',
                        `Currency` = 'INR',
                        `UpdatedAt` = NOW()
                    WHERE LOWER(`MerchantName`) LIKE '%agro%' OR LOWER(`MerchantName`) LIKE '%shyam%' OR `MerchantUpiId` LIKE '%9398649798%' OR `MerchantUpiId` LIKE '%9177758571%';";
                cmd.ExecuteNonQuery();
            }

            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `SupportTickets` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `Name` VARCHAR(150) NOT NULL,
                    `Email` VARCHAR(150) NOT NULL,
                    `Phone` VARCHAR(50) NOT NULL,
                    `Subject` VARCHAR(250) NOT NULL,
                    `Message` TEXT NOT NULL,
                    `Status` VARCHAR(50) NOT NULL DEFAULT 'Open',
                    `CreatedAt` DATETIME NOT NULL
                );";
            cmd.ExecuteNonQuery();
        }

        // 3.9 Ensure extra columns exist in Coupons table
        var existingCouponCols = new List<string>();
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SHOW COLUMNS FROM `Coupons`;";
            using (var reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    existingCouponCols.Add(reader["Field"].ToString().ToLower());
                }
            }
        }

        var couponColsToEnsure = new System.Collections.Generic.Dictionary<string, string>
        {
            { "Title", "VARCHAR(250) NULL" },
            { "Description", "TEXT NULL" },
            { "TermsAndConditions", "TEXT NULL" },
            { "BackgroundImageUrl", "VARCHAR(500) NULL" },
            { "BannerImageUrl", "VARCHAR(500) NULL" },
            { "ThumbnailImageUrl", "VARCHAR(500) NULL" },
            { "MaxDiscountAmount", "DECIMAL(18,2) NULL" },
            { "CreatedDate", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP" },
            { "UpdatedDate", "DATETIME NULL" }
        };

        foreach (var c in couponColsToEnsure)
        {
            if (!existingCouponCols.Contains(c.Key.ToLower()))
            {
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = $"ALTER TABLE `Coupons` ADD COLUMN `{c.Key}` {c.Value};";
                    cmd.ExecuteNonQuery();
                }
            }
        }

        // 3.10 Ensure extra columns exist in Customers table
        var existingCustomerCols = new List<string>();
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SHOW COLUMNS FROM `Customers`;";
            using (var reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    existingCustomerCols.Add(reader["Field"].ToString().ToLower());
                }
            }
        }

        var customerColsToEnsure = new System.Collections.Generic.Dictionary<string, string>
        {
            { "FirstName", "VARCHAR(100) NULL" },
            { "LastName", "VARCHAR(100) NULL" },
            { "Password", "VARCHAR(255) NULL" },
            { "Role", "VARCHAR(100) NOT NULL DEFAULT 'CUSTOMER ACCOUNT'" },
            { "Gender", "VARCHAR(50) NOT NULL DEFAULT 'Male'" },
            { "CompanyOrganization", "VARCHAR(200) NOT NULL DEFAULT 'Individual Account'" },
            { "AccountHolderName", "VARCHAR(200) NULL" },
            { "BankName", "VARCHAR(200) NULL" },
            { "AccountNumber", "VARCHAR(100) NULL" },
            { "IfscCode", "VARCHAR(50) NULL" },
            { "UpiId", "VARCHAR(100) NULL" },
            { "ShippingAddressJson", "TEXT NULL" },
            { "BillingAddressJson", "TEXT NULL" }
        };

        foreach (var c in customerColsToEnsure)
        {
            if (!existingCustomerCols.Contains(c.Key.ToLower()))
            {
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = $"ALTER TABLE `Customers` ADD COLUMN `{c.Key}` {c.Value};";
                    cmd.ExecuteNonQuery();
                }
            }
        }

        // Seed default Customer if missing or update details
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT COUNT(*) FROM `Customers` WHERE LOWER(`Email`) = 'bhargavakurapati49@gmail.com';";
            int custCount = Convert.ToInt32(cmd.ExecuteScalar());
            if (custCount == 0)
            {
                cmd.CommandText = @"
                    INSERT INTO `Customers` (
                        `Name`, `FirstName`, `LastName`, `Email`, `Phone`, `Password`, `Role`, `Status`, `Gender`, `CompanyOrganization`, `JoinDate`
                    ) VALUES (
                        'Bhargava Kurapati', 'Bhargava', 'Kurapati', 'bhargavakurapati49@gmail.com', '9876543210', 'Bhargava@123', 'CUSTOMER ACCOUNT', 'Active', 'Male', 'Honeywell Solutions', NOW()
                    );";
                cmd.ExecuteNonQuery();
            }
            else
            {
                cmd.CommandText = @"
                    UPDATE `Customers`
                    SET `FirstName` = COALESCE(NULLIF(`FirstName`,''), 'Bhargava'),
                        `LastName` = COALESCE(NULLIF(`LastName`,''), 'Kurapati'),
                        `Password` = COALESCE(NULLIF(`Password`,''), 'Bhargava@123'),
                        `Phone` = COALESCE(NULLIF(`Phone`,''), '9876543210'),
                        `Role` = 'CUSTOMER ACCOUNT',
                        `CompanyOrganization` = COALESCE(NULLIF(`CompanyOrganization`,''), 'Honeywell Solutions')
                    WHERE LOWER(`Email`) = 'bhargavakurapati49@gmail.com';";
                cmd.ExecuteNonQuery();
            }
        }

        // 4. Cleanup mismatched foreign keys from orderitems table to avoid FK constraint errors with Orders table
        var fkNames = new List<string>();
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orderitems' AND CONSTRAINT_NAME <> 'PRIMARY' AND CONSTRAINT_NAME IS NOT NULL;";
            using (var reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    var fkName = reader[0]?.ToString();
                    if (!string.IsNullOrEmpty(fkName))
                    {
                        fkNames.Add(fkName);
                    }
                }
            }
        }

        foreach (var fkName in fkNames)
        {
            try
            {
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = $"ALTER TABLE `orderitems` DROP FOREIGN KEY `{fkName}`;";
                    cmd.ExecuteNonQuery();
                }
            }
            catch { }
        }

        // 4. Cleanup invalid cart items referencing deleted/non-existent products
        try
        {
            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = @"
                    DELETE c FROM CartItems c
                    LEFT JOIN Products p ON c.ProductId = p.Id
                    WHERE p.Id IS NULL;";
                int deletedOrphans = cmd.ExecuteNonQuery();
                if (deletedOrphans > 0)
                {
                    Console.WriteLine($"[Startup Cleanup] Deleted {deletedOrphans} cart items referencing non-existent products.");
                }
            }

            // Create Enquiry & Partner Application tables if not existing
            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = @"
                    CREATE TABLE IF NOT EXISTS `BulkQuoteRequests` (
                        `Id` INT AUTO_INCREMENT PRIMARY KEY,
                        `Name` VARCHAR(255) NOT NULL,
                        `CompanyName` VARCHAR(255) NOT NULL,
                        `GstinNumber` VARCHAR(100) NULL,
                        `Mobile` VARCHAR(50) NOT NULL,
                        `Email` VARCHAR(255) NOT NULL,
                        `Location` VARCHAR(255) NOT NULL,
                        `Product` VARCHAR(255) NOT NULL DEFAULT 'General bulk requirement',
                        `Quantity` INT NOT NULL DEFAULT 1,
                        `Requirement` TEXT NOT NULL,
                        `Status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
                        `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS `ContactUsRequests` (
                        `Id` INT AUTO_INCREMENT PRIMARY KEY,
                        `Name` VARCHAR(255) NOT NULL,
                        `Mobile` VARCHAR(50) NOT NULL,
                        `Email` VARCHAR(255) NOT NULL,
                        `Company` VARCHAR(255) NULL,
                        `EnquiryType` VARCHAR(100) NOT NULL DEFAULT 'General',
                        `Message` TEXT NOT NULL,
                        `Status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
                        `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS `PartnerApplications` (
                        `Id` INT AUTO_INCREMENT PRIMARY KEY,
                        `CompanyName` VARCHAR(255) NOT NULL,
                        `GstinNumber` VARCHAR(100) NULL,
                        `ContactPerson` VARCHAR(255) NOT NULL,
                        `BusinessType` VARCHAR(100) NOT NULL DEFAULT 'Distributor',
                        `Mobile` VARCHAR(50) NOT NULL,
                        `Email` VARCHAR(255) NOT NULL,
                        `City` VARCHAR(100) NOT NULL,
                        `State` VARCHAR(100) NOT NULL,
                        `YearsInBusiness` VARCHAR(50) NULL,
                        `Address` TEXT NOT NULL,
                        `Description` TEXT NULL,
                        `AgreedToTerms` TINYINT(1) NOT NULL DEFAULT 1,
                        `Status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
                        `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS `ProductEnquiries` (
                        `Id` INT AUTO_INCREMENT PRIMARY KEY,
                        `Product` VARCHAR(255) NOT NULL,
                        `Name` VARCHAR(255) NOT NULL,
                        `MobileNumber` VARCHAR(50) NOT NULL,
                        `Email` VARCHAR(255) NULL,
                        `Status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
                        `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS `Solutions` (
                        `Id` VARCHAR(100) PRIMARY KEY,
                        `Title` VARCHAR(200) NOT NULL,
                        `Description` TEXT NOT NULL,
                        `Application` VARCHAR(100) NOT NULL,
                        `CategoryId` VARCHAR(100) NOT NULL,
                        `ImageUrl` TEXT NULL,
                        `Features` JSON NULL,
                        `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        `UpdatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    );";
                cmd.ExecuteNonQuery();
            }

            // Performance Database Indexing for MySQL
            var indexQueries = new[]
            {
                "CREATE INDEX `IX_Products_CategoryId` ON `Products` (`CategoryId`);",
                "CREATE INDEX `IX_Products_SubcategoryId` ON `Products` (`SubcategoryId`);",
                "CREATE INDEX `IX_Products_IsActive_Id` ON `Products` (`IsActive`, `Id` DESC);",
                "CREATE INDEX `IX_ProductFeatures_ProductId` ON `ProductFeatures` (`ProductId`);",
                "CREATE INDEX `IX_ProductReviews_ProductId` ON `ProductReviews` (`ProductId`);",
                "CREATE INDEX `IX_ProductImages_ProductId` ON `ProductImages` (`ProductId`);",
                "CREATE INDEX `IX_ProductVideos_ProductId` ON `ProductVideos` (`ProductId`);",
                "CREATE INDEX `IX_Products_Slug` ON `Products` (`SKU`);"
            };

            foreach (var q in indexQueries)
            {
                try
                {
                    using (var cmd = conn.CreateCommand())
                    {
                        cmd.CommandText = q;
                        cmd.ExecuteNonQuery();
                    }
                }
                catch { /* Ignore if index exists */ }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("Startup cleanup warning: " + ex.Message);
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine("Database schema setup warning: " + ex.Message);
    }
    finally
    {
        if (wasClosed && conn.State == System.Data.ConnectionState.Open)
        {
            conn.Close();
        }
    }
}

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Honeywell API v1");
    c.RoutePrefix = "swagger";
});

// Enable Response Compression (Brotli & Gzip)
app.UseResponseCompression();

// Cache-Control headers for read-only GET API requests
app.Use(async (context, next) =>
{
    if (context.Request.Method == "GET" && context.Request.Path.StartsWithSegments("/api"))
    {
        var path = context.Request.Path.Value ?? string.Empty;
        if (!path.Contains("/admin", StringComparison.OrdinalIgnoreCase) &&
            !path.Contains("/auth", StringComparison.OrdinalIgnoreCase) &&
            !path.Contains("/cart", StringComparison.OrdinalIgnoreCase) &&
            !path.Contains("/orders", StringComparison.OrdinalIgnoreCase) &&
            !path.Contains("/category", StringComparison.OrdinalIgnoreCase) &&
            !path.Contains("/categories", StringComparison.OrdinalIgnoreCase) &&
            !path.Contains("/catalog", StringComparison.OrdinalIgnoreCase) &&
            !path.Contains("/offers", StringComparison.OrdinalIgnoreCase) &&
            !path.Contains("/products", StringComparison.OrdinalIgnoreCase))
        {
            context.Response.Headers["Cache-Control"] = "public, max-age=300";
        }
        else
        {
            context.Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
            context.Response.Headers["Pragma"] = "no-cache";
            context.Response.Headers["Expires"] = "0";
        }
    }
    await next();
});

app.UseHttpsRedirection();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        if (ctx.Context.Request.Path.StartsWithSegments("/uploads") || ctx.Context.Request.Path.StartsWithSegments("/images"))
        {
            ctx.Context.Response.Headers["Cache-Control"] = "public, max-age=604800, stale-while-revalidate=86400";
        }
    }
});

// CORS MUST come before Authentication
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();