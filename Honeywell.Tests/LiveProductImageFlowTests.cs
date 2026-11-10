using System;
using System.Collections.Generic;
using System.IO;
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
    public class LiveProductImageFlowTests
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

        private string GenerateAdminToken()
        {
            var config = GetConfiguration();
            var jwt = new JwtService(config);
            return jwt.GenerateToken(new User
            {
                Email = "admin@honeywell.com",
                Role = "SuperAdmin",
                FullName = "Super Administrator",
                IsActive = true
            });
        }

        [Fact]
        public async Task Test_ProductEdit_WithImagesJson_PreservesAllExistingImages()
        {
            using var db = CreateLiveDbContext();

            // 1. Create a distinct test product with 2 known images
            var testSku = "TEST-IMG-" + Guid.NewGuid().ToString("N").Substring(0, 8);
            var cat = await db.Categories.FirstAsync();
            var subcat = await db.Subcategories.FirstAsync(s => s.CategoryId == cat.Id);

            var testProd = new Product
            {
                ProductName = "Image Contract Test Product",
                SKU = testSku,
                Brand = "Honeywell",
                CategoryId = cat.Id,
                SubcategoryId = subcat.Id,
                MRP = 1200,
                SellingPrice = 999,
                Stock = 15,
                ShortDescription = "Initial Short Description",
                ProductDetails = "Initial Details",
                IsActive = true,
                Images = new List<ProductImage>
                {
                    new ProductImage { ImageUrl = "/uploads/images/test_img_1.png" },
                    new ProductImage { ImageUrl = "/uploads/images/test_img_2.png" }
                }
            };

            db.Products.Add(testProd);
            await db.SaveChangesAsync();

            var createdId = testProd.Id;
            Assert.True(createdId > 0);

            try
            {
                // 2. Call the LIVE running API: PUT http://localhost:5119/api/products/{createdId}
                // Using multipart form data with ImagesJson containing the 2 existing images, without uploading any new images
                using var client = new HttpClient();
                var token = GenerateAdminToken();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

                using var form = new MultipartFormDataContent();
                form.Add(new StringContent(createdId.ToString()), "id");
                form.Add(new StringContent("Image Contract Test Product (Updated)"), "name");
                form.Add(new StringContent(testSku), "sku");
                form.Add(new StringContent("Honeywell"), "brand");
                form.Add(new StringContent(cat.Id.ToString()), "categoryId");
                form.Add(new StringContent(subcat.Id.ToString()), "subcategoryId");
                form.Add(new StringContent("1500"), "mrp");
                form.Add(new StringContent("1250"), "price");
                form.Add(new StringContent("20"), "stock");
                form.Add(new StringContent("Updated Short Description"), "shortDescription");
                form.Add(new StringContent("Updated Details"), "productDetails");
                form.Add(new StringContent("[\"/uploads/images/test_img_1.png\", \"/uploads/images/test_img_2.png\"]"), "ImagesJson");

                var response = await client.PutAsync($"http://localhost:5119/api/products/{createdId}", form);
                var content = await response.Content.ReadAsStringAsync();
                Assert.True(response.IsSuccessStatusCode, $"PUT failed with {response.StatusCode}: {content}");

                // 3. Query the LIVE API GET http://localhost:5119/api/products/{createdId}
                var getResp = await client.GetAsync($"http://localhost:5119/api/products/{createdId}");
                var getBody = await getResp.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(getBody);
                var imagesElem = doc.RootElement.GetProperty("images");

                Assert.Equal(2, imagesElem.GetArrayLength());
                var urls = imagesElem.EnumerateArray().Select(x => x.GetString()).ToList();
                Assert.Contains("/uploads/images/test_img_1.png", urls);
                Assert.Contains("/uploads/images/test_img_2.png", urls);

                // 4. Also verify directly in the database
                using var verifyDb = CreateLiveDbContext();
                var verifyProd = await verifyDb.Products.Include(p => p.Images).FirstOrDefaultAsync(p => p.Id == createdId);
                Assert.NotNull(verifyProd);
                Assert.Equal(2, verifyProd.Images.Count);
                Assert.Contains(verifyProd.Images, i => i.ImageUrl == "/uploads/images/test_img_1.png");
                Assert.Contains(verifyProd.Images, i => i.ImageUrl == "/uploads/images/test_img_2.png");
            }
            finally
            {
                // Clean up the created test product from DB
                using var cleanupDb = CreateLiveDbContext();
                var toDelete = await cleanupDb.Products.Include(p => p.Images).FirstOrDefaultAsync(p => p.Id == createdId);
                if (toDelete != null)
                {
                    cleanupDb.ProductImages.RemoveRange(toDelete.Images);
                    cleanupDb.Products.Remove(toDelete);
                    await cleanupDb.SaveChangesAsync();
                }
            }
        }
    }
}
