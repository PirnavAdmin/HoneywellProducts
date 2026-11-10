using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Honeywell.Models;
using Honeywell.Services;
using Xunit;

namespace Honeywell.Tests
{
    public class LiveApiModuleVerificationTests
    {
        private const string BaseUrl = "http://localhost:5119";

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

        private string GenerateManagerToken(string permissionsJson)
        {
            var config = GetConfiguration();
            var jwt = new JwtService(config);
            return jwt.GenerateToken(new User
            {
                Email = "testmanager@honeywell.com",
                Role = "Manager",
                FullName = "Test Manager",
                IsActive = true,
                PermissionsJson = permissionsJson
            });
        }

        [Fact]
        public async Task LiveApi_AnonymousRequests_Return401Unauthorized()
        {
            using var client = new HttpClient { BaseAddress = new Uri(BaseUrl) };

            var endpoints = new[]
            {
                (HttpMethod.Post, "/api/products", "{\"productName\":\"Test\"}"),
                (HttpMethod.Get, "/api/staff", (string?)null),
                (HttpMethod.Get, "/api/distributors/admin/all", (string?)null),
                (HttpMethod.Post, "/api/coupons", "{\"code\":\"TEST\"}"),
                (HttpMethod.Get, "/api/banners/admin", (string?)null),
                (HttpMethod.Get, "/api/reports/orders", (string?)null),
                (HttpMethod.Get, "/api/tickets", (string?)null),
                (HttpMethod.Get, "/api/enquiry/bulk-quotes", (string?)null),
                (HttpMethod.Get, "/api/PurchaseIndent", (string?)null),
                (HttpMethod.Get, "/api/PurchaseOrder", (string?)null),
                (HttpMethod.Put, "/api/Settings/footer", "{\"aboutSummary\":\"Test\"}"),
                (HttpMethod.Get, "/api/customers", (string?)null),
                (HttpMethod.Get, "/api/notifications", (string?)null),
                (HttpMethod.Get, "/api/Stock/ledger", (string?)null)
            };

            foreach (var (method, path, body) in endpoints)
            {
                var req = new HttpRequestMessage(method, path);
                if (body != null)
                {
                    req.Content = new StringContent(body, Encoding.UTF8, "application/json");
                }

                var resp = await client.SendAsync(req);
                Assert.True(resp.StatusCode == HttpStatusCode.Unauthorized,
                    $"Expected 401 for anonymous {method} {path}, got {resp.StatusCode}");
            }
        }

        [Fact]
        public async Task LiveApi_PublicEndpoints_Return200Ok()
        {
            using var client = new HttpClient { BaseAddress = new Uri(BaseUrl) };

            var publicPaths = new[]
            {
                "/api/products",
                "/api/Category",
                "/api/Banners",
                "/api/Blog",
                "/api/Settings/footer",
                "/api/Distributors",
                "/api/Offers",
                "/api/solutions",
                "/api/About"
            };

            foreach (var path in publicPaths)
            {
                var resp = await client.GetAsync(path);
                Assert.True(resp.StatusCode == HttpStatusCode.OK,
                    $"Expected 200 for public GET {path}, got {resp.StatusCode}");
            }
        }

        [Fact]
        public async Task LiveApi_AdminRequests_Return200OkAcrossAllModules()
        {
            using var client = new HttpClient { BaseAddress = new Uri(BaseUrl) };
            var token = GenerateAdminToken();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var adminGetPaths = new[]
            {
                "/api/staff",
                "/api/distributors/admin/all",
                "/api/reports/orders",
                "/api/PurchaseIndent",
                "/api/tickets",
                "/api/enquiry/bulk-quotes",
                "/api/customers",
                "/api/banners/admin",
                "/api/Stock/ledger"
            };

            foreach (var path in adminGetPaths)
            {
                var resp = await client.GetAsync(path);
                Assert.True(resp.StatusCode == HttpStatusCode.OK,
                    $"Expected 200 for Admin GET {path}, got {resp.StatusCode}");
            }
        }

        [Fact]
        public async Task LiveApi_ManagerPermissions_EnforceViewAllowedAndMutationForbidden()
        {
            using var client = new HttpClient { BaseAddress = new Uri(BaseUrl) };

            // Manager with orders:view ONLY
            var permissions = "[{\"moduleName\":\"orders\",\"canView\":true,\"canAdd\":false,\"canEdit\":false,\"canDelete\":false}]";
            var token = GenerateManagerToken(permissions);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            // 1. Allowed view on orders module -> 200 OK
            var allowedResp = await client.GetAsync("/api/orders");
            Assert.True(allowedResp.StatusCode == HttpStatusCode.OK,
                $"Expected 200 for Manager GET /api/orders, got {allowedResp.StatusCode}");

            // 2. Denied mutation on orders module -> 403 Forbidden
            var updateReq = new HttpRequestMessage(HttpMethod.Put, "/api/orders/1/status")
            {
                Content = new StringContent("{\"status\":\"Completed\"}", Encoding.UTF8, "application/json")
            };
            var deniedMutationResp = await client.SendAsync(updateReq);
            Assert.True(deniedMutationResp.StatusCode == HttpStatusCode.Forbidden,
                $"Expected 403 for Manager PUT /api/orders/1/status, got {deniedMutationResp.StatusCode}");

            // 3. Denied view on unpermitted module (staff) -> 403 Forbidden
            var deniedModuleResp = await client.GetAsync("/api/staff");
            Assert.True(deniedModuleResp.StatusCode == HttpStatusCode.Forbidden,
                $"Expected 403 for Manager GET /api/staff, got {deniedModuleResp.StatusCode}");

            // 4. Denied view on unpermitted module (distributors) -> 403 Forbidden
            var deniedDistResp = await client.GetAsync("/api/distributors/admin/all");
            Assert.True(deniedDistResp.StatusCode == HttpStatusCode.Forbidden,
                $"Expected 403 for Manager GET /api/distributors/admin/all, got {deniedDistResp.StatusCode}");

            // 5. Denied mutation on unpermitted module (catalog) -> 403 Forbidden
            var deniedCatReq = new HttpRequestMessage(HttpMethod.Post, "/api/products")
            {
                Content = new StringContent("{\"productName\":\"Unauthorized Product\"}", Encoding.UTF8, "application/json")
            };
            var deniedCatResp = await client.SendAsync(deniedCatReq);
            Assert.True(deniedCatResp.StatusCode == HttpStatusCode.Forbidden,
                $"Expected 403 for Manager POST /api/products, got {deniedCatResp.StatusCode}");
        }
    }
}
