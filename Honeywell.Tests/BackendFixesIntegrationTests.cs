using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Honeywell.Controllers;
using Honeywell.Data;
using Honeywell.DTOs.Catalog;
using Honeywell.Helpers;
using Honeywell.Models;
using Honeywell.Services.Interfaces;
using Xunit;

namespace Honeywell.Tests
{
    public class BackendFixesIntegrationTests
    {
        private ApplicationDbContext CreateInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new ApplicationDbContext(options);
        }

        private class FakeJwtService : IJwtService
        {
            public string GenerateToken(User user) => "fake.jwt.token";
            public string GenerateTokenForCustomer(Customer customer) => "fake.jwt.token";
            public string GenerateTokenForTestUser(TestUser user) => "fake.jwt.token";
        }

        [Fact]
        public void Staff_ExplicitlyClearedPermissions_MustRemainEmpty()
        {
            // Arrange: staff with explicit empty permissions
            var staff = new Staff
            {
                Id = 1,
                Name = "John Doe",
                Role = "manager",
                Permissions = new List<string>() // Explicitly cleared
            };

            Assert.Equal("[]", staff.PermissionsJson);

            // Act: call NormalizeStaffEntity via private method reflection
            var method = typeof(StaffController).GetMethod("NormalizeStaffEntity", BindingFlags.NonPublic | BindingFlags.Static);
            Assert.NotNull(method);
            method.Invoke(null, new object[] { staff });

            // Assert: permissions must remain empty list and NOT be overwritten by role defaults
            Assert.Empty(staff.Permissions);
            Assert.Equal("[]", staff.PermissionsJson);
        }

        [Fact]
        public void Staff_UnconfiguredPermissions_PopulatesRoleDefaults()
        {
            // Arrange: staff with null PermissionsJson (unconfigured)
            var staff = new Staff
            {
                Id = 2,
                Name = "Jane Smith",
                Role = "manager",
                PermissionsJson = null
            };

            var method = typeof(StaffController).GetMethod("NormalizeStaffEntity", BindingFlags.NonPublic | BindingFlags.Static);
            Assert.NotNull(method);
            method.Invoke(null, new object[] { staff });

            // Assert: role defaults for manager populated
            Assert.NotEmpty(staff.Permissions);
            Assert.Contains("catalog", staff.Permissions);
            Assert.Contains("orders", staff.Permissions);
        }

        [Fact]
        public async Task StaffController_Update_PersistsClearedPermissionsInDb()
        {
            // Arrange
            using var db = CreateInMemoryDbContext();
            var existingStaff = new Staff
            {
                Id = 10,
                EmployeeId = "EMP-0010",
                Name = "Alex Manager",
                Email = "alex@test.com",
                Role = "manager",
                Permissions = new List<string> { "catalog", "orders" },
                IsActive = true
            };
            db.Staff.Add(existingStaff);
            await db.SaveChangesAsync();

            var controller = new StaffController(db, new FakeJwtService());

            // Act: Admin updates staff with explicitly cleared permissions []
            var updatePayload = new Staff
            {
                Name = "Alex Manager",
                Role = "manager",
                Permissions = new List<string>() // empty
            };

            var result = await controller.Update("10", updatePayload) as OkObjectResult;
            Assert.NotNull(result);

            // Assert: database record has PermissionsJson == "[]" and Permissions.Count == 0
            var reloaded = await db.Staff.FindAsync(10);
            Assert.NotNull(reloaded);
            Assert.Equal("[]", reloaded.PermissionsJson);
            Assert.Empty(reloaded.Permissions);
        }

        [Fact]
        public async Task ProductsController_Update_PreservesExistingImages()
        {
            // Arrange
            using var db = CreateInMemoryDbContext();
            var category = new Category { Id = 1, Name = "Industrial Automation" };
            var subcategory = new Subcategory { Id = 1, Name = "Sensors", CategoryId = 1 };
            db.Categories.Add(category);
            db.Subcategories.Add(subcategory);

            var product = new Product
            {
                Id = 100,
                ProductName = "Honeywell Pressure Transmitter",
                SKU = "HON-PT-001",
                CategoryId = 1,
                SubcategoryId = 1,
                MRP = 1000,
                SellingPrice = 850,
                Stock = 20,
                Images = new List<ProductImage>
                {
                    new ProductImage { Id = 1, ProductId = 100, ImageUrl = "/uploads/images/prod1.png" },
                    new ProductImage { Id = 2, ProductId = 100, ImageUrl = "/uploads/images/prod2.png" }
                }
            };
            db.Products.Add(product);
            await db.SaveChangesAsync();

            var controller = new ProductsController(db);
            var httpContext = new DefaultHttpContext();
            httpContext.Request.ContentType = "application/json";
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            // Act: Update product details while providing ImagesJson retaining both images
            var dto = new CreateProductDto
            {
                ProductName = "Honeywell Pressure Transmitter Pro",
                SKU = "HON-PT-001",
                CategoryId = 1,
                SubcategoryId = 1,
                SellingPrice = 900,
                ImagesJson = "[\"/uploads/images/prod1.png\", \"/uploads/images/prod2.png\"]"
            };

            var result = await controller.UpdateProduct(100, dto) as OkObjectResult;
            Assert.NotNull(result);

            // Assert: Both images were preserved in DB and no duplicate records were created
            var reloaded = await db.Products.Include(p => p.Images).FirstOrDefaultAsync(p => p.Id == 100);
            Assert.NotNull(reloaded);
            Assert.Equal(2, reloaded.Images.Count);
            Assert.Contains(reloaded.Images, i => i.ImageUrl == "/uploads/images/prod1.png");
            Assert.Contains(reloaded.Images, i => i.ImageUrl == "/uploads/images/prod2.png");
        }

        [Fact]
        public async Task AuthorizeModuleAttribute_EnforcesRoleAndPermissions()
        {
            var services = new ServiceCollection();
            using var db = CreateInMemoryDbContext();
            services.AddSingleton(db);
            var serviceProvider = services.BuildServiceProvider();

            var attr = new AuthorizeModuleAttribute("catalog");

            // 1. Unauthenticated request -> 401
            var unauthContext = CreateAuthorizationFilterContext(new ClaimsPrincipal(), serviceProvider);
            await attr.OnAuthorizationAsync(unauthContext);
            Assert.IsType<ObjectResult>(unauthContext.Result);
            Assert.Equal(401, ((ObjectResult)unauthContext.Result!).StatusCode);

            // 2. Staff without "catalog" permission -> 403 Forbidden
            var staffWithoutPermClaims = new[]
            {
                new Claim(ClaimTypes.Role, "Staff"),
                new Claim(ClaimTypes.Email, "staff1@honeywell.com"),
                new Claim("permissions", "[\"dashboard\"]")
            };
            var staffWithoutPermPrincipal = new ClaimsPrincipal(new ClaimsIdentity(staffWithoutPermClaims, "Bearer"));
            var forbiddenContext = CreateAuthorizationFilterContext(staffWithoutPermPrincipal, serviceProvider);
            await attr.OnAuthorizationAsync(forbiddenContext);
            Assert.IsType<ObjectResult>(forbiddenContext.Result);
            Assert.Equal(403, ((ObjectResult)forbiddenContext.Result!).StatusCode);

            // 3. Staff with "catalog" permission -> Allowed (Result is null)
            var staffWithPermClaims = new[]
            {
                new Claim(ClaimTypes.Role, "Staff"),
                new Claim(ClaimTypes.Email, "catalogstaff@honeywell.com"),
                new Claim("permissions", "[\"catalog\", \"dashboard\"]")
            };
            var staffWithPermPrincipal = new ClaimsPrincipal(new ClaimsIdentity(staffWithPermClaims, "Bearer"));
            var allowedStaffContext = CreateAuthorizationFilterContext(staffWithPermPrincipal, serviceProvider);
            await attr.OnAuthorizationAsync(allowedStaffContext);
            Assert.Null(allowedStaffContext.Result);

            // 4. Admin -> Allowed full access
            var adminClaims = new[]
            {
                new Claim(ClaimTypes.Role, "Admin"),
                new Claim(ClaimTypes.Email, "admin@honeywell.com")
            };
            var adminPrincipal = new ClaimsPrincipal(new ClaimsIdentity(adminClaims, "Bearer"));
            var adminContext = CreateAuthorizationFilterContext(adminPrincipal, serviceProvider);
            await attr.OnAuthorizationAsync(adminContext);
            Assert.Null(adminContext.Result);
        }

        private AuthorizationFilterContext CreateAuthorizationFilterContext(ClaimsPrincipal user, IServiceProvider services, string method = "GET", string path = "/api/products")
        {
            var httpContext = new DefaultHttpContext
            {
                User = user,
                RequestServices = services
            };
            httpContext.Request.Method = method;
            httpContext.Request.Path = path;
            var actionContext = new ActionContext(httpContext, new RouteData(), new ActionDescriptor());
            return new AuthorizationFilterContext(actionContext, new List<IFilterMetadata>());
        }
    }
}
