using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Honeywell.Controllers;
using Honeywell.Data;
using Honeywell.Helpers;
using Honeywell.Models;
using Xunit;

namespace Honeywell.Tests
{
    public class RbacAuthorizationTests
    {
        private const string TestJwtKey = "Honeywell2026@JWTSecretKey#1234567890";
        private const string TestIssuer = "Honeywell";
        private const string TestAudience = "HoneywellUsers";

        private ApplicationDbContext CreateInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new ApplicationDbContext(options);
        }

        private IServiceProvider CreateServiceProvider(ApplicationDbContext db)
        {
            var services = new ServiceCollection();
            services.AddSingleton(db);

            var inMemorySettings = new Dictionary<string, string?>
            {
                { "Jwt:Key", TestJwtKey },
                { "Jwt:Issuer", TestIssuer },
                { "Jwt:Audience", TestAudience }
            };
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();
            services.AddSingleton<IConfiguration>(configuration);

            return services.BuildServiceProvider();
        }

        private string GenerateJwtToken(string email, string role, string permissionsJson, bool isExpired = false)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(TestJwtKey);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.Name, email),
                    new Claim(ClaimTypes.Email, email),
                    new Claim(ClaimTypes.Role, role),
                    new Claim("role", role),
                    new Claim("email", email),
                    new Claim("permissions", permissionsJson)
                }),
                NotBefore = isExpired ? DateTime.UtcNow.AddHours(-3) : (DateTime?)null,
                IssuedAt = isExpired ? DateTime.UtcNow.AddHours(-3) : (DateTime?)null,
                Expires = isExpired ? DateTime.UtcNow.AddHours(-2) : DateTime.UtcNow.AddHours(2),
                Issuer = TestIssuer,
                Audience = TestAudience,
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        private AuthorizationFilterContext CreateAuthContext(
            ClaimsPrincipal? user,
            IServiceProvider services,
            string method = "GET",
            string path = "/api/products",
            string? bearerToken = null,
            Dictionary<string, string>? customHeaders = null)
        {
            var httpContext = new DefaultHttpContext
            {
                User = user ?? new ClaimsPrincipal(new ClaimsIdentity()),
                RequestServices = services
            };
            httpContext.Request.Method = method;
            httpContext.Request.Path = path;

            if (!string.IsNullOrWhiteSpace(bearerToken))
            {
                httpContext.Request.Headers["Authorization"] = $"Bearer {bearerToken}";
            }

            if (customHeaders != null)
            {
                foreach (var (k, v) in customHeaders)
                {
                    httpContext.Request.Headers[k] = v;
                }
            }

            var actionContext = new ActionContext(httpContext, new RouteData(), new ActionDescriptor());
            return new AuthorizationFilterContext(actionContext, new List<IFilterMetadata>());
        }

        // ==========================================
        // 1. ANONYMOUS REQUEST TESTS (MUST RETURN 401)
        // ==========================================

        [Theory]
        [InlineData("POST", "/api/products", PermissionAction.Add, "catalog")]
        [InlineData("PUT", "/api/products/11", PermissionAction.Edit, "catalog")]
        [InlineData("DELETE", "/api/products/11", PermissionAction.Delete, "catalog")]
        [InlineData("POST", "/api/products/delete/11", PermissionAction.Delete, "catalog")]
        [InlineData("PUT", "/api/staff/11", PermissionAction.Edit, "staff")]
        [InlineData("POST", "/api/staff", PermissionAction.Add, "staff")]
        [InlineData("DELETE", "/api/staff/11", PermissionAction.Delete, "staff")]
        [InlineData("GET", "/api/staff", PermissionAction.View, "staff")]
        [InlineData("GET", "/api/orders", PermissionAction.View, "orders")]
        [InlineData("PUT", "/api/orders/1/status", PermissionAction.Edit, "orders")]
        [InlineData("DELETE", "/api/orders/1", PermissionAction.Delete, "orders")]
        [InlineData("POST", "/api/category", PermissionAction.Add, "catalog")]
        [InlineData("PUT", "/api/category/1", PermissionAction.Edit, "catalog")]
        [InlineData("DELETE", "/api/category/1", PermissionAction.Delete, "catalog")]
        public async Task AnonymousRequest_ToProtectedEndpoint_Returns401Unauthorized(
            string method, string path, PermissionAction action, string module)
        {
            using var db = CreateInMemoryDbContext();
            var services = CreateServiceProvider(db);
            var attr = new AuthorizeModuleAttribute(action, module);

            var context = CreateAuthContext(null, services, method, path);
            await attr.OnAuthorizationAsync(context);

            Assert.NotNull(context.Result);
            var objResult = Assert.IsType<ObjectResult>(context.Result);
            Assert.Equal(401, objResult.StatusCode);
        }

        [Fact]
        public async Task AnonymousPutStaff_Returns401InsteadOf400()
        {
            // Specifically verifies the defect: Unauthenticated PUT /api/staff/11 returned 400 instead of 401.
            // With IAsyncAuthorizationFilter, authorization executes BEFORE model validation.
            using var db = CreateInMemoryDbContext();
            var services = CreateServiceProvider(db);
            var attr = new AuthorizeModuleAttribute(PermissionAction.Edit, "staff");

            var context = CreateAuthContext(null, services, "PUT", "/api/staff/11");
            await attr.OnAuthorizationAsync(context);

            Assert.NotNull(context.Result);
            var objResult = Assert.IsType<ObjectResult>(context.Result);
            Assert.Equal(401, objResult.StatusCode);
        }

        // ==========================================
        // 2. JWT VALIDATION & SPOOFING REJECTION TESTS
        // ==========================================

        [Fact]
        public async Task InvalidJwt_Returns401Unauthorized()
        {
            using var db = CreateInMemoryDbContext();
            var services = CreateServiceProvider(db);
            var attr = new AuthorizeModuleAttribute(PermissionAction.Add, "catalog");

            var context = CreateAuthContext(null, services, "POST", "/api/products", bearerToken: "malformed.invalid.token");
            await attr.OnAuthorizationAsync(context);

            Assert.NotNull(context.Result);
            var objResult = Assert.IsType<ObjectResult>(context.Result);
            Assert.Equal(401, objResult.StatusCode);
        }

        [Fact]
        public async Task ExpiredJwt_Returns401Unauthorized()
        {
            using var db = CreateInMemoryDbContext();
            var services = CreateServiceProvider(db);
            var attr = new AuthorizeModuleAttribute(PermissionAction.Add, "catalog");

            var expiredToken = GenerateJwtToken("admin@honeywell.com", "Admin", "[]", isExpired: true);
            var context = CreateAuthContext(null, services, "POST", "/api/products", bearerToken: expiredToken);
            await attr.OnAuthorizationAsync(context);

            Assert.NotNull(context.Result);
            var objResult = Assert.IsType<ObjectResult>(context.Result);
            Assert.Equal(401, objResult.StatusCode);
        }

        [Fact]
        public async Task SpoofedXUserEmailHeader_WithoutValidJwt_Returns401Unauthorized()
        {
            // Verifies rule: Never trust frontend permissions or request-supplied headers (e.g. X-User-Email)
            using var db = CreateInMemoryDbContext();
            var services = CreateServiceProvider(db);
            var attr = new AuthorizeModuleAttribute(PermissionAction.Add, "catalog");

            var headers = new Dictionary<string, string>
            {
                { "X-User-Email", "bhargavakurapati49@gmail.com" }, // Attempting to spoof SuperAdmin email
                { "X-User-Role", "SuperAdmin" }
            };

            var context = CreateAuthContext(null, services, "POST", "/api/products", customHeaders: headers);
            await attr.OnAuthorizationAsync(context);

            Assert.NotNull(context.Result);
            var objResult = Assert.IsType<ObjectResult>(context.Result);
            Assert.Equal(401, objResult.StatusCode);
        }

        // ==========================================
        // 3. MANAGER VIEW-ONLY TESTS (GET ALLOWED, MUTATIONS FORBIDDEN 403)
        // ==========================================

        [Fact]
        public async Task Manager_ViewOnly_GetAllowed_MutationsForbidden403()
        {
            using var db = CreateInMemoryDbContext();
            var services = CreateServiceProvider(db);

            // Token with view-only permissions on catalog
            var token = GenerateJwtToken("viewmanager@honeywell.com", "Manager", "[\"catalog:view\"]");

            // 1. GET /api/products -> Allowed (Result is null)
            var getAttr = new AuthorizeModuleAttribute(PermissionAction.View, "catalog");
            var getCtx = CreateAuthContext(null, services, "GET", "/api/products", bearerToken: token);
            await getAttr.OnAuthorizationAsync(getCtx);
            Assert.Null(getCtx.Result);

            // 2. POST /api/products -> 403 Forbidden
            var postAttr = new AuthorizeModuleAttribute(PermissionAction.Add, "catalog");
            var postCtx = CreateAuthContext(null, services, "POST", "/api/products", bearerToken: token);
            await postAttr.OnAuthorizationAsync(postCtx);
            Assert.NotNull(postCtx.Result);
            Assert.Equal(403, Assert.IsType<ObjectResult>(postCtx.Result).StatusCode);

            // 3. PUT /api/products/10 -> 403 Forbidden
            var putAttr = new AuthorizeModuleAttribute(PermissionAction.Edit, "catalog");
            var putCtx = CreateAuthContext(null, services, "PUT", "/api/products/10", bearerToken: token);
            await putAttr.OnAuthorizationAsync(putCtx);
            Assert.NotNull(putCtx.Result);
            Assert.Equal(403, Assert.IsType<ObjectResult>(putCtx.Result).StatusCode);

            // 4. DELETE /api/products/10 -> 403 Forbidden
            var delAttr = new AuthorizeModuleAttribute(PermissionAction.Delete, "catalog");
            var delCtx = CreateAuthContext(null, services, "DELETE", "/api/products/10", bearerToken: token);
            await delAttr.OnAuthorizationAsync(delCtx);
            Assert.NotNull(delCtx.Result);
            Assert.Equal(403, Assert.IsType<ObjectResult>(delCtx.Result).StatusCode);

            // 5. POST /api/products/delete/10 -> 403 Forbidden
            var postDelCtx = CreateAuthContext(null, services, "POST", "/api/products/delete/10", bearerToken: token);
            await delAttr.OnAuthorizationAsync(postDelCtx);
            Assert.NotNull(postDelCtx.Result);
            Assert.Equal(403, Assert.IsType<ObjectResult>(postDelCtx.Result).StatusCode);
        }

        [Fact]
        public async Task Manager_ViewOnlyObjectFormat_GetAllowed_MutationsForbidden403()
        {
            using var db = CreateInMemoryDbContext();
            var services = CreateServiceProvider(db);

            // Token with object permission format: { moduleName: "catalog", canView: true, canAdd: false, canEdit: false, canDelete: false }
            var permsJson = "[{\"moduleName\":\"catalog\",\"canView\":true,\"canAdd\":false,\"canEdit\":false,\"canDelete\":false}]";
            var token = GenerateJwtToken("viewonly@honeywell.com", "Manager", permsJson);

            // GET -> Allowed
            var getAttr = new AuthorizeModuleAttribute(PermissionAction.View, "catalog");
            var getCtx = CreateAuthContext(null, services, "GET", "/api/products", bearerToken: token);
            await getAttr.OnAuthorizationAsync(getCtx);
            Assert.Null(getCtx.Result);

            // POST -> 403
            var postAttr = new AuthorizeModuleAttribute(PermissionAction.Add, "catalog");
            var postCtx = CreateAuthContext(null, services, "POST", "/api/products", bearerToken: token);
            await postAttr.OnAuthorizationAsync(postCtx);
            Assert.NotNull(postCtx.Result);
            Assert.Equal(403, Assert.IsType<ObjectResult>(postCtx.Result).StatusCode);
        }

        // ==========================================
        // 4. GRANULAR CRUD ISOLATION TESTS (ADD-ONLY, EDIT-ONLY, DELETE-ONLY)
        // ==========================================

        [Fact]
        public async Task Manager_AddOnly_AllowsPost_RejectsGetPutDelete()
        {
            using var db = CreateInMemoryDbContext();
            var services = CreateServiceProvider(db);

            var token = GenerateJwtToken("addonly@honeywell.com", "Manager", "[\"catalog:add\"]");

            var addAttr = new AuthorizeModuleAttribute(PermissionAction.Add, "catalog");
            var editAttr = new AuthorizeModuleAttribute(PermissionAction.Edit, "catalog");
            var delAttr = new AuthorizeModuleAttribute(PermissionAction.Delete, "catalog");

            // POST is allowed
            var postCtx = CreateAuthContext(null, services, "POST", "/api/products", bearerToken: token);
            await addAttr.OnAuthorizationAsync(postCtx);
            Assert.Null(postCtx.Result);

            // PUT is 403
            var putCtx = CreateAuthContext(null, services, "PUT", "/api/products/1", bearerToken: token);
            await editAttr.OnAuthorizationAsync(putCtx);
            Assert.Equal(403, Assert.IsType<ObjectResult>(putCtx.Result).StatusCode);

            // DELETE is 403
            var delCtx = CreateAuthContext(null, services, "DELETE", "/api/products/1", bearerToken: token);
            await delAttr.OnAuthorizationAsync(delCtx);
            Assert.Equal(403, Assert.IsType<ObjectResult>(delCtx.Result).StatusCode);
        }

        [Fact]
        public async Task Manager_EditOnly_AllowsPut_RejectsPostDelete()
        {
            using var db = CreateInMemoryDbContext();
            var services = CreateServiceProvider(db);

            var token = GenerateJwtToken("editonly@honeywell.com", "Manager", "[\"catalog:edit\"]");

            var addAttr = new AuthorizeModuleAttribute(PermissionAction.Add, "catalog");
            var editAttr = new AuthorizeModuleAttribute(PermissionAction.Edit, "catalog");
            var delAttr = new AuthorizeModuleAttribute(PermissionAction.Delete, "catalog");

            // PUT is allowed
            var putCtx = CreateAuthContext(null, services, "PUT", "/api/products/1", bearerToken: token);
            await editAttr.OnAuthorizationAsync(putCtx);
            Assert.Null(putCtx.Result);

            // POST is 403
            var postCtx = CreateAuthContext(null, services, "POST", "/api/products", bearerToken: token);
            await addAttr.OnAuthorizationAsync(postCtx);
            Assert.Equal(403, Assert.IsType<ObjectResult>(postCtx.Result).StatusCode);

            // DELETE is 403
            var delCtx = CreateAuthContext(null, services, "DELETE", "/api/products/1", bearerToken: token);
            await delAttr.OnAuthorizationAsync(delCtx);
            Assert.Equal(403, Assert.IsType<ObjectResult>(delCtx.Result).StatusCode);
        }

        [Fact]
        public async Task Manager_DeleteOnly_AllowsDelete_RejectsPostPut()
        {
            using var db = CreateInMemoryDbContext();
            var services = CreateServiceProvider(db);

            var token = GenerateJwtToken("deleteonly@honeywell.com", "Manager", "[\"catalog:delete\"]");

            var addAttr = new AuthorizeModuleAttribute(PermissionAction.Add, "catalog");
            var editAttr = new AuthorizeModuleAttribute(PermissionAction.Edit, "catalog");
            var delAttr = new AuthorizeModuleAttribute(PermissionAction.Delete, "catalog");

            // DELETE is allowed
            var delCtx = CreateAuthContext(null, services, "DELETE", "/api/products/1", bearerToken: token);
            await delAttr.OnAuthorizationAsync(delCtx);
            Assert.Null(delCtx.Result);

            // POST is 403
            var postCtx = CreateAuthContext(null, services, "POST", "/api/products", bearerToken: token);
            await addAttr.OnAuthorizationAsync(postCtx);
            Assert.Equal(403, Assert.IsType<ObjectResult>(postCtx.Result).StatusCode);

            // PUT is 403
            var putCtx = CreateAuthContext(null, services, "PUT", "/api/products/1", bearerToken: token);
            await editAttr.OnAuthorizationAsync(putCtx);
            Assert.Equal(403, Assert.IsType<ObjectResult>(putCtx.Result).StatusCode);
        }

        // ==========================================
        // 5. ADMIN FULL CRUD UNRESTRICTED TESTS
        // ==========================================

        [Theory]
        [InlineData("Admin")]
        [InlineData("SuperAdmin")]
        [InlineData("Administrator")]
        public async Task AdminRoles_RetainUnrestrictedAccessAcrossAllActions(string adminRole)
        {
            using var db = CreateInMemoryDbContext();
            var services = CreateServiceProvider(db);

            var token = GenerateJwtToken($"{adminRole.ToLower()}@honeywell.com", adminRole, "[]");

            var actions = new[]
            {
                (PermissionAction.View, "GET", "/api/products"),
                (PermissionAction.Add, "POST", "/api/products"),
                (PermissionAction.Edit, "PUT", "/api/products/1"),
                (PermissionAction.Delete, "DELETE", "/api/products/1"),
                (PermissionAction.View, "GET", "/api/staff"),
                (PermissionAction.Add, "POST", "/api/staff"),
                (PermissionAction.Edit, "PUT", "/api/staff/1"),
                (PermissionAction.Delete, "DELETE", "/api/staff/1"),
                (PermissionAction.View, "GET", "/api/orders"),
                (PermissionAction.Edit, "PUT", "/api/orders/1/status"),
                (PermissionAction.Delete, "DELETE", "/api/orders/1")
            };

            foreach (var (action, method, path) in actions)
            {
                var mod = path.Contains("staff") ? "staff" : path.Contains("orders") ? "orders" : "catalog";
                var attr = new AuthorizeModuleAttribute(action, mod);
                var ctx = CreateAuthContext(null, services, method, path, bearerToken: token);
                await attr.OnAuthorizationAsync(ctx);
                Assert.Null(ctx.Result); // Admin allowed without any restriction
            }
        }

        // ==========================================
        // 6. MULTI-MODULE ACTION-LEVEL ENFORCEMENT
        // ==========================================

        [Fact]
        public async Task StaffModule_EnforcesActionLevelGranularity()
        {
            using var db = CreateInMemoryDbContext();
            var services = CreateServiceProvider(db);

            // User has staff:view only
            var token = GenerateJwtToken("staffviewer@honeywell.com", "Manager", "[\"staff:view\"]");

            var viewAttr = new AuthorizeModuleAttribute(PermissionAction.View, "staff");
            var editAttr = new AuthorizeModuleAttribute(PermissionAction.Edit, "staff");
            var delAttr = new AuthorizeModuleAttribute(PermissionAction.Delete, "staff");

            // GET /api/staff -> Allowed
            var getCtx = CreateAuthContext(null, services, "GET", "/api/staff", bearerToken: token);
            await viewAttr.OnAuthorizationAsync(getCtx);
            Assert.Null(getCtx.Result);

            // PUT /api/staff/11 -> 403 Forbidden
            var putCtx = CreateAuthContext(null, services, "PUT", "/api/staff/11", bearerToken: token);
            await editAttr.OnAuthorizationAsync(putCtx);
            Assert.Equal(403, Assert.IsType<ObjectResult>(putCtx.Result).StatusCode);

            // DELETE /api/staff/11 -> 403 Forbidden
            var delCtx = CreateAuthContext(null, services, "DELETE", "/api/staff/11", bearerToken: token);
            await delAttr.OnAuthorizationAsync(delCtx);
            Assert.Equal(403, Assert.IsType<ObjectResult>(delCtx.Result).StatusCode);
        }

        [Fact]
        public async Task OrdersModule_EnforcesActionLevelGranularity()
        {
            using var db = CreateInMemoryDbContext();
            var services = CreateServiceProvider(db);

            // User has orders:view only
            var token = GenerateJwtToken("ordersviewer@honeywell.com", "Manager", "[\"orders:view\"]");

            var viewAttr = new AuthorizeModuleAttribute(PermissionAction.View, "orders");
            var editAttr = new AuthorizeModuleAttribute(PermissionAction.Edit, "orders");
            var delAttr = new AuthorizeModuleAttribute(PermissionAction.Delete, "orders");

            // GET /api/orders -> Allowed
            var getCtx = CreateAuthContext(null, services, "GET", "/api/orders", bearerToken: token);
            await viewAttr.OnAuthorizationAsync(getCtx);
            Assert.Null(getCtx.Result);

            // PUT /api/orders/1/status -> 403 Forbidden
            var putCtx = CreateAuthContext(null, services, "PUT", "/api/orders/1/status", bearerToken: token);
            await editAttr.OnAuthorizationAsync(putCtx);
            Assert.Equal(403, Assert.IsType<ObjectResult>(putCtx.Result).StatusCode);

            // DELETE /api/orders/1 -> 403 Forbidden
            var delCtx = CreateAuthContext(null, services, "DELETE", "/api/orders/1", bearerToken: token);
            await delAttr.OnAuthorizationAsync(delCtx);
            Assert.Equal(403, Assert.IsType<ObjectResult>(delCtx.Result).StatusCode);
        }
    }
}
