using System;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Honeywell.Data;
using Honeywell.Models;
using Honeywell.Services;
using Xunit;

namespace Honeywell.Tests
{
    public class LiveDatabaseAndApiTests
    {
        private static IConfiguration GetConfiguration()
        {
            var basePath = AppContext.BaseDirectory;
            return new ConfigurationBuilder()
                .SetBasePath(basePath)
                .AddJsonFile("appsettings.json", optional: true)
                .AddJsonFile(Path.Combine(basePath, "..", "..", "..", "..", "Honeywell-Backend", "appsettings.json"), optional: true)
                .AddEnvironmentVariables()
                .Build();
        }

        private ApplicationDbContext CreateLiveDbContext()
        {
            var config = GetConfiguration();
            var connStr = config.GetConnectionString("DefaultConnection") 
                ?? Environment.GetEnvironmentVariable("HONEYWELL_DB_CONNECTION") 
                ?? "Server=43.205.186.167;Port=3306;Database=honeywell_products;User=honeywelluser;Password=Honeywell@2026;SslMode=None;AllowPublicKeyRetrieval=True;";

            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseMySql(connStr, new MySqlServerVersion(new Version(8, 0, 32)))
                .Options;
            return new ApplicationDbContext(options);
        }

        [Fact]
        public async Task Check_Product110_ImageRecords_WithoutDeleting()
        {
            using var db = CreateLiveDbContext();
            var product = await db.Products.Include(p => p.Images).FirstOrDefaultAsync(p => p.Id == 110)
                          ?? await db.Products.Include(p => p.Images).FirstOrDefaultAsync(p => p.Images.Any());
            Assert.NotNull(product);

            Console.WriteLine($"[Product {product.Id}] Name: {product.ProductName}, SKU: {product.SKU}");
            Console.WriteLine($"[Product {product.Id}] Total Images in DB: {product.Images.Count}");
            foreach (var img in product.Images)
            {
                Console.WriteLine($"  - ImageId: {img.Id}, ImageUrl: {img.ImageUrl}");
            }

            // Verify they are retrieved without modifying any record
            Assert.True(product.Images.Count > 0);
        }

        [Fact]
        public async Task Test_Staff_Permissions_Persistence_OnLiveDb()
        {
            using var db = CreateLiveDbContext();
            // Look for a test staff member or verify existing staff permissions
            var testStaff = await db.Staff.FirstOrDefaultAsync(s => s.Email == "test_manager@honeywell.com");
            if (testStaff == null)
            {
                testStaff = new Staff
                {
                    Name = "Test Manager",
                    Email = "test_manager@honeywell.com",
                    Role = "Manager",
                    Department = "Management",
                    IsActive = true,
                    Permissions = new System.Collections.Generic.List<string>() // empty
                };
                db.Staff.Add(testStaff);
                await db.SaveChangesAsync();
            }
            else
            {
                testStaff.Permissions = new System.Collections.Generic.List<string>();
                await db.SaveChangesAsync();
            }

            // Reload from live DB
            var reloaded = await db.Staff.AsNoTracking().FirstOrDefaultAsync(s => s.Id == testStaff.Id);
            Assert.NotNull(reloaded);
            Assert.Equal("[]", reloaded.PermissionsJson);
            Assert.Empty(reloaded.Permissions);
        }

        [Fact]
        public async Task InspectAllImageUrlsAndStaffInDatabase()
        {
            using var db = CreateLiveDbContext();

            // 1. Check ProductImages patterns
            var allImages = await db.ProductImages.AsNoTracking().Select(i => new { i.ProductId, i.ImageUrl }).ToListAsync();
            Console.WriteLine($"[DB IMAGE AUDIT] Total ProductImages count: {allImages.Count}");

            var localhostImages = allImages.Where(i => i.ImageUrl != null && i.ImageUrl.Contains("localhost")).ToList();
            Console.WriteLine($"[DB IMAGE AUDIT] Images containing 'localhost': {localhostImages.Count}");
            foreach (var img in localhostImages.Take(10))
            {
                Console.WriteLine($"  - Product {img.ProductId}: {img.ImageUrl}");
            }

            var httpImages = allImages.Where(i => i.ImageUrl != null && (i.ImageUrl.StartsWith("http://") || i.ImageUrl.StartsWith("https://"))).ToList();
            Console.WriteLine($"[DB IMAGE AUDIT] Images with absolute http/https URLs: {httpImages.Count}");
            var domainGroups = httpImages
                .Select(i => {
                    try { return new Uri(i.ImageUrl).GetLeftPart(UriPartial.Authority); }
                    catch { return "Invalid URI"; }
                })
                .GroupBy(d => d);
            foreach (var g in domainGroups)
            {
                Console.WriteLine($"  - Domain '{g.Key}': {g.Count()} images");
            }

            var relativeImages = allImages.Where(i => i.ImageUrl != null && i.ImageUrl.StartsWith("/")).ToList();
            Console.WriteLine($"[DB IMAGE AUDIT] Images with relative /... URLs: {relativeImages.Count}");
            foreach (var img in relativeImages.Take(10))
            {
                Console.WriteLine($"  - Product {img.ProductId}: {img.ImageUrl}");
            }

            // 2. Check test staff accounts
            var testStaffList = await db.Staff.AsNoTracking().Where(s => s.Email.Contains("test_manager") || s.Email.Contains("test")).ToListAsync();
            Console.WriteLine($"[DB STAFF AUDIT] Found {testStaffList.Count} test staff accounts:");
            foreach (var s in testStaffList)
            {
                Console.WriteLine($"  - ID: {s.Id}, Name: {s.Name}, Email: {s.Email}, Role: {s.Role}, IsActive: {s.IsActive}, PermissionsJson: {s.PermissionsJson}");
            }
        }

        [Fact]
        public async Task GetExactNgrokImagesForCleanupReport()
        {
            using var db = CreateLiveDbContext();
            var ngrokImages = await db.ProductImages.AsNoTracking()
                .Where(i => i.ImageUrl != null && i.ImageUrl.Contains("ngrok"))
                .OrderBy(i => i.ProductId)
                .ThenBy(i => i.Id)
                .ToListAsync();

            Console.WriteLine($"\n=== NGROK IMAGES AUDIT REPORT ({ngrokImages.Count} records found) ===");
            foreach (var img in ngrokImages)
            {
                var proposedUrl = img.ImageUrl.Substring(img.ImageUrl.IndexOf("/uploads/"));
                Console.WriteLine($"ImageId: {img.Id} | ProductId: {img.ProductId}");
                Console.WriteLine($"  Current URL : {img.ImageUrl}");
                Console.WriteLine($"  Proposed URL: {proposedUrl}");
            }

            Console.WriteLine("\nProposed SQL UPDATE Statement:");
            Console.WriteLine("UPDATE `ProductImages` SET `ImageUrl` = SUBSTRING(`ImageUrl`, INSTR(`ImageUrl`, '/uploads/')) WHERE `ImageUrl` LIKE '%ngrok%';");
        }

        [Fact]
        public async Task Deactivate_TestManager_And_Verify_Cannot_Login()
        {
            using var db = CreateLiveDbContext();
            var testStaffList = await db.Staff.Where(s => s.Email == "test_manager@honeywell.com").ToListAsync();
            Assert.NotEmpty(testStaffList);

            foreach (var s in testStaffList)
            {
                s.IsActive = false;
                s.Password = "TestPassword123!";
                Console.WriteLine($"Deactivating Staff ID {s.Id} ({s.Email}) - setting IsActive = false");
            }
            await db.SaveChangesAsync();

            // Verify in DB that it is inactive
            foreach (var s in testStaffList)
            {
                var check = await db.Staff.AsNoTracking().FirstOrDefaultAsync(x => x.Id == s.Id);
                Assert.NotNull(check);
                Assert.False(check.IsActive);
            }

            // Verify via StaffController.Login
            var configData = new System.Collections.Generic.Dictionary<string, string>
            {
                ["Jwt:Key"] = "Honeywell2026@JWTSecretKey#1234567890",
                ["Jwt:Issuer"] = "Honeywell",
                ["Jwt:Audience"] = "HoneywellUsers"
            };
            var config = new Microsoft.Extensions.Configuration.ConfigurationBuilder().AddInMemoryCollection(configData!).Build();
            var jwt = new Honeywell.Services.JwtService(config);
            var controller = new Honeywell.Controllers.StaffController(db, jwt);

            var loginResult = await controller.Login(new StaffLoginRequestDto
            {
                Email = "test_manager@honeywell.com",
                Password = "TestPassword123!"
            });

            var objectResult = Assert.IsType<Microsoft.AspNetCore.Mvc.ObjectResult>(loginResult);
            Assert.Equal(403, objectResult.StatusCode);
            Console.WriteLine($"Login attempt for deactivated test manager correctly returned HTTP {objectResult.StatusCode} Forbidden.");
        }
    }
}
