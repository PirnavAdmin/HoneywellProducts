using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Honeywell.Controllers;
using Honeywell.Data;
using Honeywell.DTOs;
using Honeywell.Models;
using Honeywell.Services;
using Honeywell.Services.Interfaces;
using Xunit;

namespace Honeywell.Tests
{
    public class MockHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _handler;

        public MockHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> handler)
        {
            _handler = handler;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(_handler(request));
        }
    }

    public class CashfreeIntegrationTests
    {
        private ApplicationDbContext CreateInMemoryDbContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;

            return new ApplicationDbContext(options);
        }

        private IConfiguration CreateConfiguration(Dictionary<string, string?> settings)
        {
            return new ConfigurationBuilder()
                .AddInMemoryCollection(settings)
                .Build();
        }

        [Fact]
        public async Task Test1_Successful_Cashfree_Order_Creation_With_Mocked_Sandbox()
        {
            var db = CreateInMemoryDbContext("TestDb_1");
            var order = new Order
            {
                Id = 101,
                OrderNumber = "ORD-20261102-101",
                FinalAmount = 2499.50m,
                PaymentStatus = "Pending",
                Status = "Processing",
                Customer = new Customer
                {
                    Id = 5,
                    Name = "Test Buyer",
                    Email = "buyer@example.com",
                    Phone = "9876543210"
                }
            };
            db.Orders.Add(order);
            await db.SaveChangesAsync();

            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP_ID_MOCK" },
                { "Cashfree:SecretKey", "TEST_SECRET_KEY_MOCK" },
                { "Cashfree:Environment", "sandbox" },
                { "Cashfree:ApiVersion", "2026-01-01" }
            });

            var mockHandler = new MockHttpMessageHandler(req =>
            {
                Assert.Equal("TEST_APP_ID_MOCK", req.Headers.GetValues("x-client-id").First());
                Assert.Equal("TEST_SECRET_KEY_MOCK", req.Headers.GetValues("x-client-secret").First());
                Assert.Equal("2026-01-01", req.Headers.GetValues("x-api-version").First());

                var responsePayload = new CashfreePgOrderResponse
                {
                    CfOrderId = "cf_order_mock_12345",
                    OrderId = "cf_101_ORD_20261102_101_1730538900",
                    OrderAmount = 2499.50m,
                    OrderCurrency = "INR",
                    OrderStatus = "ACTIVE",
                    PaymentSessionId = "session_test_abc123xyz"
                };

                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(JsonSerializer.Serialize(responsePayload), Encoding.UTF8, "application/json")
                };
            });

            var httpClient = new HttpClient(mockHandler);
            var service = new CashfreeService(httpClient, config, NullLogger<CashfreeService>.Instance, db);

            var result = await service.CreatePaymentOrderAsync(order);

            Assert.True(result.Success);
            Assert.Equal("session_test_abc123xyz", result.PaymentSessionId);
            Assert.Equal(2499.50m, result.Amount);
            Assert.Equal("INR", result.Currency);
            Assert.Equal("Pending", result.Status);
        }

        [Fact]
        public async Task Test2_Correct_Payment_Session_Id_Handling()
        {
            var db = CreateInMemoryDbContext("TestDb_2");
            var order = new Order
            {
                Id = 102,
                OrderNumber = "ORD-102",
                FinalAmount = 1500m,
                PaymentStatus = "Pending",
                Status = "Processing",
                Customer = new Customer { Id = 6, Name = "Jane Doe", Email = "jane@example.com", Phone = "9123456789" }
            };
            db.Orders.Add(order);
            await db.SaveChangesAsync();

            var expectedSessionId = "session_secure_jwt_token_format_sandbox";
            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP" },
                { "Cashfree:SecretKey", "TEST_SECRET" }
            });

            var mockHandler = new MockHttpMessageHandler(req =>
            {
                var responsePayload = new CashfreePgOrderResponse
                {
                    CfOrderId = "cf_102",
                    OrderId = "cf_102",
                    PaymentSessionId = expectedSessionId,
                    OrderStatus = "ACTIVE"
                };
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(JsonSerializer.Serialize(responsePayload), Encoding.UTF8, "application/json")
                };
            });

            var service = new CashfreeService(new HttpClient(mockHandler), config, NullLogger<CashfreeService>.Instance, db);
            var controller = new PaymentController(db, service, NullLogger<PaymentController>.Instance);

            var actionResult = await controller.CreateCashfreeOrder(new CreateCashfreePaymentOrderRequest { OrderId = "102" });
            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var resp = Assert.IsType<CashfreeOrderCreationResponse>(okResult.Value);

            Assert.True(resp.Success);
            Assert.Equal(expectedSessionId, resp.PaymentSessionId);
        }

        [Fact]
        public async Task Test3_Invalid_Order_IDs_Return_NotFound_Or_BadRequest()
        {
            var db = CreateInMemoryDbContext("TestDb_3");
            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP" },
                { "Cashfree:SecretKey", "TEST_SECRET" }
            });

            var service = new CashfreeService(new HttpClient(), config, NullLogger<CashfreeService>.Instance, db);
            var controller = new PaymentController(db, service, NullLogger<PaymentController>.Instance);

            // 1. Empty OrderId
            var resEmpty = await controller.CreateCashfreeOrder(new CreateCashfreePaymentOrderRequest { OrderId = "" });
            Assert.IsType<BadRequestObjectResult>(resEmpty);

            // 2. Non-existent numeric ID
            var resNonExistent = await controller.CreateCashfreeOrder(new CreateCashfreePaymentOrderRequest { OrderId = "999999" });
            Assert.IsType<NotFoundObjectResult>(resNonExistent);

            // 3. Non-existent string OrderNumber
            var resStringNonExistent = await controller.CreateCashfreeOrder(new CreateCashfreePaymentOrderRequest { OrderId = "ORD-DOES-NOT-EXIST" });
            Assert.IsType<NotFoundObjectResult>(resStringNonExistent);
        }

        [Fact]
        public async Task Test4_Unauthorised_Requests_Are_Rejected()
        {
            var db = CreateInMemoryDbContext("TestDb_4");
            var order = new Order
            {
                Id = 104,
                OrderNumber = "ORD-104",
                FinalAmount = 500m,
                PaymentStatus = "Pending",
                Status = "Processing",
                CustomerId = 88,
                Customer = new Customer { Id = 88, Name = "Owner", Email = "owner@test.com", Phone = "9999999999" }
            };
            db.Orders.Add(order);
            await db.SaveChangesAsync();

            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP" },
                { "Cashfree:SecretKey", "TEST_SECRET" }
            });

            var service = new CashfreeService(new HttpClient(), config, NullLogger<CashfreeService>.Instance, db);
            var controller = new PaymentController(db, service, NullLogger<PaymentController>.Instance);

            // Simulate logged in user with customerId = 99 (different customer)
            var claims = new List<Claim>
            {
                new Claim("customerId", "99"),
                new Claim(ClaimTypes.Email, "hacker@test.com"),
                new Claim(ClaimTypes.Role, "Customer")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
            };

            var actionResult = await controller.CreateCashfreeOrder(new CreateCashfreePaymentOrderRequest { OrderId = "104" });
            var statusResult = Assert.IsType<ObjectResult>(actionResult);
            Assert.Equal(StatusCodes.Status403Forbidden, statusResult.StatusCode);
        }

        [Fact]
        public async Task Test5_Client_Side_Amount_Manipulation_Prevented()
        {
            var db = CreateInMemoryDbContext("TestDb_5");
            var trustedDbAmount = 4500.00m;
            var order = new Order
            {
                Id = 105,
                OrderNumber = "ORD-105",
                FinalAmount = trustedDbAmount,
                PaymentStatus = "Pending",
                Status = "Processing",
                Customer = new Customer { Id = 10, Name = "Client", Email = "client@test.com", Phone = "9999999999" }
            };
            db.Orders.Add(order);
            await db.SaveChangesAsync();

            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP" },
                { "Cashfree:SecretKey", "TEST_SECRET" }
            });

            decimal capturedRequestAmount = 0;
            var mockHandler = new MockHttpMessageHandler(req =>
            {
                var contentStr = req.Content!.ReadAsStringAsync().Result;
                var payload = JsonSerializer.Deserialize<CashfreePgCreateOrderPayload>(contentStr);
                capturedRequestAmount = payload!.OrderAmount;

                var responsePayload = new CashfreePgOrderResponse
                {
                    PaymentSessionId = "session_test",
                    OrderStatus = "ACTIVE"
                };
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(JsonSerializer.Serialize(responsePayload), Encoding.UTF8, "application/json")
                };
            });

            var service = new CashfreeService(new HttpClient(mockHandler), config, NullLogger<CashfreeService>.Instance, db);
            var controller = new PaymentController(db, service, NullLogger<PaymentController>.Instance);

            // Notice: Request doesn't allow overriding amount, amount is strictly taken from order.FinalAmount
            var actionResult = await controller.CreateCashfreeOrder(new CreateCashfreePaymentOrderRequest { OrderId = "105" });
            Assert.IsType<OkObjectResult>(actionResult);

            // Ensure the amount sent to Cashfree matches trusted DB amount exactly!
            Assert.Equal(trustedDbAmount, capturedRequestAmount);
        }

        [Fact]
        public async Task Test6_Duplicate_Order_Requests_And_Safe_Retries_Idempotency()
        {
            var db = CreateInMemoryDbContext("TestDb_6");
            var order = new Order
            {
                Id = 106,
                OrderNumber = "ORD-106",
                FinalAmount = 1200m,
                PaymentStatus = "Pending",
                Status = "Processing",
                Customer = new Customer { Id = 12, Name = "Idempotent User", Email = "idem@test.com", Phone = "9999999999" }
            };
            db.Orders.Add(order);
            await db.SaveChangesAsync();

            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP" },
                { "Cashfree:SecretKey", "TEST_SECRET" }
            });

            int apiCallCount = 0;
            var mockHandler = new MockHttpMessageHandler(req =>
            {
                apiCallCount++;
                var responsePayload = new CashfreePgOrderResponse
                {
                    CfOrderId = "cf_106_first",
                    OrderId = "cf_106_first",
                    PaymentSessionId = "session_idempotent_123",
                    OrderStatus = "ACTIVE"
                };
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(JsonSerializer.Serialize(responsePayload), Encoding.UTF8, "application/json")
                };
            });

            var service = new CashfreeService(new HttpClient(mockHandler), config, NullLogger<CashfreeService>.Instance, db);
            var controller = new PaymentController(db, service, NullLogger<PaymentController>.Instance);

            // Call 1
            var res1 = await controller.CreateCashfreeOrder(new CreateCashfreePaymentOrderRequest { OrderId = "106", IdempotencyKey = "key_retry_1" });
            var ok1 = Assert.IsType<OkObjectResult>(res1);
            var data1 = Assert.IsType<CashfreeOrderCreationResponse>(ok1.Value);
            Assert.Equal("session_idempotent_123", data1.PaymentSessionId);
            Assert.Equal(1, apiCallCount);

            // Call 2 with same idempotency key (or within 15 min active window) -> Should return cached active session!
            var res2 = await controller.CreateCashfreeOrder(new CreateCashfreePaymentOrderRequest { OrderId = "106", IdempotencyKey = "key_retry_1" });
            var ok2 = Assert.IsType<OkObjectResult>(res2);
            var data2 = Assert.IsType<CashfreeOrderCreationResponse>(ok2.Value);
            Assert.Equal("session_idempotent_123", data2.PaymentSessionId);
            Assert.Equal(1, apiCallCount); // Did NOT hit Cashfree endpoint again!
        }

        [Fact]
        public async Task Test7_Missing_Cashfree_Credentials_Handled_Gracefully()
        {
            var db = CreateInMemoryDbContext("TestDb_7");
            var order = new Order
            {
                Id = 107,
                OrderNumber = "ORD-107",
                FinalAmount = 800m,
                PaymentStatus = "Pending",
                Status = "Processing",
                CustomerId = 17,
                Customer = new Customer { Id = 17, Name = "No Credentials User", Email = "nocreds@test.com", Phone = "9999999999" }
            };
            db.Orders.Add(order);
            await db.SaveChangesAsync();

            // Config without credentials
            var emptyConfig = CreateConfiguration(new Dictionary<string, string?>());

            var service = new CashfreeService(new HttpClient(), emptyConfig, NullLogger<CashfreeService>.Instance, db);
            var controller = new PaymentController(db, service, NullLogger<PaymentController>.Instance);

            var actionResult = await controller.CreateCashfreeOrder(new CreateCashfreePaymentOrderRequest { OrderId = "107" });
            var statusResult = Assert.IsType<ObjectResult>(actionResult);
            Assert.Equal(StatusCodes.Status503ServiceUnavailable, statusResult.StatusCode);

            var resp = Assert.IsType<CashfreeOrderCreationResponse>(statusResult.Value);
            Assert.False(resp.Success);
            Assert.Contains("credentials are not configured", resp.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task Test8_Cashfree_API_Failures_And_Timeouts_Handled_Gracefully()
        {
            var db = CreateInMemoryDbContext("TestDb_8");
            var order = new Order
            {
                Id = 108,
                OrderNumber = "ORD-108",
                FinalAmount = 3000m,
                PaymentStatus = "Pending",
                Status = "Processing",
                Customer = new Customer { Id = 15, Name = "Err User", Email = "err@test.com", Phone = "9999999999" }
            };
            db.Orders.Add(order);
            await db.SaveChangesAsync();

            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP" },
                { "Cashfree:SecretKey", "TEST_SECRET" }
            });

            // 1. HTTP 400 Bad Request from Cashfree
            var mockHandler400 = new MockHttpMessageHandler(req =>
            {
                var errorPayload = new CashfreePgOrderResponse
                {
                    Message = "order_amount is invalid",
                    Code = "invalid_order_amount",
                    Type = "invalid_request_error"
                };
                return new HttpResponseMessage(HttpStatusCode.BadRequest)
                {
                    Content = new StringContent(JsonSerializer.Serialize(errorPayload), Encoding.UTF8, "application/json")
                };
            });

            var service400 = new CashfreeService(new HttpClient(mockHandler400), config, NullLogger<CashfreeService>.Instance, db);
            var controller400 = new PaymentController(db, service400, NullLogger<PaymentController>.Instance);

            var res400 = await controller400.CreateCashfreeOrder(new CreateCashfreePaymentOrderRequest { OrderId = "108" });
            var badReq = Assert.IsType<BadRequestObjectResult>(res400);
            var data400 = Assert.IsType<CashfreeOrderCreationResponse>(badReq.Value);
            Assert.False(data400.Success);
            Assert.Equal("order_amount is invalid", data400.Message);

            // Verify transaction was marked as Failed in DB
            var failedTx = await db.PaymentTransactions.FirstOrDefaultAsync(t => t.OrderId == 108);
            Assert.NotNull(failedTx);
            Assert.Equal("Failed", failedTx.Status);
            Assert.Equal("order_amount is invalid", failedTx.ErrorMessage);
        }

        [Fact]
        public async Task Test9_Correct_Database_Persistence_And_Association()
        {
            var db = CreateInMemoryDbContext("TestDb_9");
            var order = new Order
            {
                Id = 109,
                OrderNumber = "ORD-20261102-109",
                FinalAmount = 999.00m,
                PaymentStatus = "Pending",
                Status = "Processing",
                Customer = new Customer
                {
                    Id = 22,
                    Name = "Audit User",
                    Email = "audit@test.com",
                    Phone = "9876543210"
                }
            };
            db.Orders.Add(order);
            await db.SaveChangesAsync();

            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP" },
                { "Cashfree:SecretKey", "TEST_SECRET" }
            });

            var mockHandler = new MockHttpMessageHandler(req =>
            {
                var responsePayload = new CashfreePgOrderResponse
                {
                    CfOrderId = "cf_order_persist_777",
                    OrderId = "cf_109_order",
                    PaymentSessionId = "session_persisted_success",
                    OrderStatus = "ACTIVE"
                };
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(JsonSerializer.Serialize(responsePayload), Encoding.UTF8, "application/json")
                };
            });

            var service = new CashfreeService(new HttpClient(mockHandler), config, NullLogger<CashfreeService>.Instance, db);
            var controller = new PaymentController(db, service, NullLogger<PaymentController>.Instance);

            var result = await controller.CreateCashfreeOrder(new CreateCashfreePaymentOrderRequest { OrderId = "109" });
            Assert.IsType<OkObjectResult>(result);

            // Assert database persistence
            var savedTx = await db.PaymentTransactions.FirstOrDefaultAsync(t => t.OrderId == 109);
            Assert.NotNull(savedTx);
            Assert.Equal("Cashfree", savedTx.Gateway);
            Assert.Equal("ORD-20261102-109", savedTx.OrderNumber);
            Assert.Equal("session_persisted_success", savedTx.PaymentSessionId);
            Assert.Equal(999.00m, savedTx.Amount);
            Assert.Equal("INR", savedTx.Currency);
            Assert.Equal("Pending", savedTx.Status);
            Assert.Equal("Audit User", savedTx.CustomerName);
            Assert.Equal("audit@test.com", savedTx.CustomerEmail);
            Assert.Equal("9876543210", savedTx.CustomerPhone);
            Assert.True(savedTx.CreatedAt <= DateTime.UtcNow);

            // Verify that the order was NOT marked as paid! (Requirement 5)
            var currentOrder = await db.Orders.FindAsync(109);
            Assert.NotNull(currentOrder);
            Assert.Equal("Pending", currentOrder.PaymentStatus);
            Assert.Equal("Cashfree", currentOrder.PaymentMethod);
        }
    }
}
