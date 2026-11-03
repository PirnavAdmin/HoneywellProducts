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
                GuestToken = "guest_session_token_102",
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

            var actionResult = await controller.CreateCashfreeOrder(new CreateCashfreePaymentOrderRequest { OrderId = "102", CustomerEmail = "jane@example.com", CustomerPhone = "9123456789", GuestToken = "guest_session_token_102" });
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
                GuestToken = "guest_tok_105",
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
            var actionResult = await controller.CreateCashfreeOrder(new CreateCashfreePaymentOrderRequest { OrderId = "105", CustomerEmail = "client@test.com", CustomerPhone = "9999999999", GuestToken = "guest_tok_105" });
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
                GuestToken = "guest_tok_106",
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
            var res1 = await controller.CreateCashfreeOrder(new CreateCashfreePaymentOrderRequest { OrderId = "106", CustomerEmail = "idem@test.com", CustomerPhone = "9999999999", GuestToken = "guest_tok_106", IdempotencyKey = "key_retry_1" });
            var ok1 = Assert.IsType<OkObjectResult>(res1);
            var data1 = Assert.IsType<CashfreeOrderCreationResponse>(ok1.Value);
            Assert.Equal("session_idempotent_123", data1.PaymentSessionId);
            Assert.Equal(1, apiCallCount);

            // Call 2 with same idempotency key (or within 15 min active window) -> Should return cached active session!
            var res2 = await controller.CreateCashfreeOrder(new CreateCashfreePaymentOrderRequest { OrderId = "106", CustomerEmail = "idem@test.com", CustomerPhone = "9999999999", GuestToken = "guest_tok_106", IdempotencyKey = "key_retry_1" });
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
                GuestToken = "guest_tok_107",
                CustomerId = 17,
                Customer = new Customer { Id = 17, Name = "No Credentials User", Email = "nocreds@test.com", Phone = "9999999999" }
            };
            db.Orders.Add(order);
            await db.SaveChangesAsync();

            // Config without credentials
            var emptyConfig = CreateConfiguration(new Dictionary<string, string?>());

            var service = new CashfreeService(new HttpClient(), emptyConfig, NullLogger<CashfreeService>.Instance, db);
            var controller = new PaymentController(db, service, NullLogger<PaymentController>.Instance);

            var actionResult = await controller.CreateCashfreeOrder(new CreateCashfreePaymentOrderRequest { OrderId = "107", CustomerEmail = "nocreds@test.com", CustomerPhone = "9999999999", GuestToken = "guest_tok_107" });
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
                GuestToken = "guest_tok_108",
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

            var res400 = await controller400.CreateCashfreeOrder(new CreateCashfreePaymentOrderRequest { OrderId = "108", CustomerEmail = "err@test.com", CustomerPhone = "9999999999", GuestToken = "guest_tok_108" });
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
                GuestToken = "guest_tok_109",
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

            var result = await controller.CreateCashfreeOrder(new CreateCashfreePaymentOrderRequest { OrderId = "109", CustomerEmail = "audit@test.com", CustomerPhone = "9876543210", GuestToken = "guest_tok_109" });
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

        [Fact]
        public async Task Test10_Invoice_Payment_Initiation_Via_InvoicesController()
        {
            var db = CreateInMemoryDbContext("TestDb_10");
            var order = new Order
            {
                Id = 110,
                OrderNumber = "ORD-20261102-110",
                TotalAmount = 5000m,
                GstAmount = 900m,
                FinalAmount = 5900m,
                PaymentStatus = "Pending",
                Status = "Processing",
                GuestToken = "guest_tok_110",
                Customer = new Customer
                {
                    Id = 30,
                    Name = "Enterprise Client",
                    Email = "billing@enterprise.com",
                    Phone = "9876543210"
                }
            };
            db.Orders.Add(order);
            await db.SaveChangesAsync();

            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP_ID_MOCK" },
                { "Cashfree:SecretKey", "TEST_SECRET_KEY_MOCK" },
                { "Cashfree:Environment", "sandbox" }
            });

            var mockHandler = new MockHttpMessageHandler(req =>
            {
                var responsePayload = new CashfreePgOrderResponse
                {
                    CfOrderId = "cf_inv_110",
                    OrderId = "cf_110_ORD_20261102_110",
                    OrderAmount = 5900m,
                    OrderCurrency = "INR",
                    OrderStatus = "ACTIVE",
                    PaymentSessionId = "session_invoice_pay_abc"
                };
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(JsonSerializer.Serialize(responsePayload), Encoding.UTF8, "application/json")
                };
            });

            var cashfreeService = new CashfreeService(new HttpClient(mockHandler), config, NullLogger<CashfreeService>.Instance, db);
            var invoicesController = new InvoicesController(db, cashfreeService, NullLogger<InvoicesController>.Instance);

            // Initiate payment using Invoice ID format "INV-20261102-110"
            var actionResult = await invoicesController.InitiatePayment("INV-20261102-110", new CreateCashfreePaymentOrderRequest { CustomerEmail = "billing@enterprise.com", CustomerPhone = "9876543210", GuestToken = "guest_tok_110" });
            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var response = Assert.IsType<CashfreeOrderCreationResponse>(okResult.Value);

            Assert.True(response.Success);
            Assert.Equal(110, response.OrderId);
            Assert.Equal("ORD-20261102-110", response.OrderNumber);
            Assert.Equal("session_invoice_pay_abc", response.PaymentSessionId);
            Assert.Equal(5900m, response.Amount);
            Assert.Equal("INR", response.Currency);
            Assert.Equal("sandbox", response.Environment);

            // Verify database transaction created
            var tx = await db.PaymentTransactions.FirstOrDefaultAsync(t => t.OrderId == 110);
            Assert.NotNull(tx);
            Assert.Equal("session_invoice_pay_abc", tx.PaymentSessionId);
            Assert.Equal(5900m, tx.Amount);
        }

        [Fact]
        public async Task Test11_Enforce_Sandbox_Exclusively_And_Api_Version_2026_01_01()
        {
            var db = CreateInMemoryDbContext("TestDb_11");
            // Attempt to pass production in config
            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP" },
                { "Cashfree:SecretKey", "TEST_SECRET" },
                { "Cashfree:Environment", "production" }
            });

            var service = new CashfreeService(new HttpClient(), config, NullLogger<CashfreeService>.Instance, db);

            // Requirement 2: Environment must be sandbox exclusively
            Assert.Equal("sandbox", service.GetEnvironment());

            // Requirement 4: API version 2026-01-01
            Assert.Equal("2026-01-01", service.GetApiVersion());
        }

        [Fact]
        public async Task Test12_Public_Vs_Local_Notify_Url_Sanitization()
        {
            var db = CreateInMemoryDbContext("TestDb_12");
            var order = new Order
            {
                Id = 112,
                OrderNumber = "ORD-112",
                FinalAmount = 1000m,
                PaymentStatus = "Pending",
                Status = "Processing",
                Customer = new Customer { Id = 35, Name = "URL User", Email = "url@test.com", Phone = "9999999999" }
            };
            db.Orders.Add(order);
            await db.SaveChangesAsync();

            string? capturedPayloadString = null;
            var mockHandler = new MockHttpMessageHandler(req =>
            {
                capturedPayloadString = req.Content!.ReadAsStringAsync().Result;
                var responsePayload = new CashfreePgOrderResponse
                {
                    CfOrderId = "cf_112",
                    PaymentSessionId = "session_url_test",
                    OrderStatus = "ACTIVE"
                };
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(JsonSerializer.Serialize(responsePayload), Encoding.UTF8, "application/json")
                };
            });

            // Case A: Local notify_url -> Should be excluded (Requirement 8)
            var localConfig = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP" },
                { "Cashfree:SecretKey", "TEST_SECRET" },
                { "Cashfree:NotifyUrl", "http://localhost:5119/api/Payment/cashfree-webhook" }
            });

            var localService = new CashfreeService(new HttpClient(mockHandler), localConfig, NullLogger<CashfreeService>.Instance, db);
            var resultLocal = await localService.CreatePaymentOrderAsync(order);
            Assert.True(resultLocal.Success);
            Assert.NotNull(capturedPayloadString);
            Assert.DoesNotContain("notify_url", capturedPayloadString);

            // Case B: Public HTTPS notify_url -> Should be included
            var publicConfig = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP" },
                { "Cashfree:SecretKey", "TEST_SECRET" },
                { "Cashfree:NotifyUrl", "https://drab-smoking-unstaffed.ngrok-free.dev/api/Payment/cashfree-webhook" }
            });

            var publicOrder = new Order
            {
                Id = 113,
                OrderNumber = "ORD-113",
                FinalAmount = 1500m,
                PaymentStatus = "Pending",
                Status = "Processing",
                Customer = new Customer { Id = 36, Name = "Public User", Email = "pub@test.com", Phone = "9999999999" }
            };
            db.Orders.Add(publicOrder);
            await db.SaveChangesAsync();

            var publicService = new CashfreeService(new HttpClient(mockHandler), publicConfig, NullLogger<CashfreeService>.Instance, db);
            var resultPublic = await publicService.CreatePaymentOrderAsync(publicOrder);
            Assert.True(resultPublic.Success);
            Assert.Contains("drab-smoking-unstaffed.ngrok-free.dev", capturedPayloadString);
        }

        [Fact]
        public async Task Test13_Invoice_InitiatePayment_Unauthorized_Access_Returns_403Forbidden()
        {
            var db = CreateInMemoryDbContext("TestDb_13");
            var order = new Order
            {
                Id = 114,
                OrderNumber = "ORD-20261102-114",
                FinalAmount = 3500m,
                PaymentStatus = "Pending",
                Status = "Processing",
                CustomerId = 55,
                Customer = new Customer
                {
                    Id = 55,
                    Name = "Protected Owner",
                    Email = "owner@domain.com",
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

            var cashfreeService = new CashfreeService(new HttpClient(), config, NullLogger<CashfreeService>.Instance, db);
            var invoicesController = new InvoicesController(db, cashfreeService, NullLogger<InvoicesController>.Instance);

            // 1. Unauthenticated stranger call without matching email/phone -> Must be 403 Forbidden
            var unauthorizedResult = await invoicesController.InitiatePayment("INV-20261102-114", new CreateCashfreePaymentOrderRequest
            {
                CustomerEmail = "stranger@evil.com",
                CustomerPhone = "1111111111"
            });

            var statusResult = Assert.IsType<ObjectResult>(unauthorizedResult);
            Assert.Equal(StatusCodes.Status403Forbidden, statusResult.StatusCode);

            // 2. Call with matching registered customer email and phone -> Allowed
            var mockHandler = new MockHttpMessageHandler(req =>
            {
                var responsePayload = new CashfreePgOrderResponse
                {
                    PaymentSessionId = "session_authorized_inv",
                    OrderStatus = "ACTIVE"
                };
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(JsonSerializer.Serialize(responsePayload), Encoding.UTF8, "application/json")
                };
            });

            var authService = new CashfreeService(new HttpClient(mockHandler), config, NullLogger<CashfreeService>.Instance, db);
            var authInvoicesController = new InvoicesController(db, authService, NullLogger<InvoicesController>.Instance);

            var claims = new List<Claim>
            {
                new Claim("customerId", "55"),
                new Claim(ClaimTypes.Email, "owner@domain.com"),
                new Claim(ClaimTypes.Role, "Customer")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            authInvoicesController.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
            };

            var authorizedResult = await authInvoicesController.InitiatePayment("INV-20261102-114", new CreateCashfreePaymentOrderRequest
            {
                CustomerEmail = "owner@domain.com",
                CustomerPhone = "9876543210"
            });

            var okResult = Assert.IsType<OkObjectResult>(authorizedResult);
            var response = Assert.IsType<CashfreeOrderCreationResponse>(okResult.Value);
            Assert.True(response.Success);
            Assert.Equal("session_authorized_inv", response.PaymentSessionId);
        }

        [Fact]
        public async Task Test14_Guest_Order_Ownership_Requires_Cryptographic_Guest_Token()
        {
            var db = CreateInMemoryDbContext("TestDb_14");
            var guestOrder = new Order
            {
                Id = 115,
                OrderNumber = "ORD-20261102-115",
                FinalAmount = 1800m,
                PaymentStatus = "Pending",
                Status = "Processing",
                CustomerId = 0,
                GuestToken = "secure_guest_token_abc123xyz789",
                Customer = new Customer
                {
                    Id = 0,
                    Name = "Guest Shopper",
                    Email = "shopper@guest.com",
                    Phone = "9123456780"
                }
            };
            db.Orders.Add(guestOrder);
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
                    PaymentSessionId = "session_guest_success",
                    OrderStatus = "ACTIVE"
                };
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(JsonSerializer.Serialize(responsePayload), Encoding.UTF8, "application/json")
                };
            });

            var service = new CashfreeService(new HttpClient(mockHandler), config, NullLogger<CashfreeService>.Instance, db);
            var controller = new PaymentController(db, service, NullLogger<PaymentController>.Instance);

            // 1. Attacker guesses OrderId and matching email and phone, but has NO GuestToken -> 403 Forbidden
            var guessResult = await controller.CreateCashfreeOrder(new CreateCashfreePaymentOrderRequest
            {
                OrderId = "115",
                CustomerEmail = "shopper@guest.com",
                CustomerPhone = "9123456780"
            });
            var forbiddenObj1 = Assert.IsType<ObjectResult>(guessResult);
            Assert.Equal(StatusCodes.Status403Forbidden, forbiddenObj1.StatusCode);

            // 2. Attacker provides wrong / forged GuestToken -> 403 Forbidden
            var forgedResult = await controller.CreateCashfreeOrder(new CreateCashfreePaymentOrderRequest
            {
                OrderId = "115",
                CustomerEmail = "shopper@guest.com",
                CustomerPhone = "9123456780",
                GuestToken = "wrong_forged_guest_token"
            });
            var forbiddenObj2 = Assert.IsType<ObjectResult>(forgedResult);
            Assert.Equal(StatusCodes.Status403Forbidden, forbiddenObj2.StatusCode);

            // 3. Legitimate user provides exact server-issued GuestToken -> 200 OK Allowed
            var goodResult = await controller.CreateCashfreeOrder(new CreateCashfreePaymentOrderRequest
            {
                OrderId = "115",
                CustomerEmail = "shopper@guest.com",
                CustomerPhone = "9123456780",
                GuestToken = "secure_guest_token_abc123xyz789"
            });
            var okObj = Assert.IsType<OkObjectResult>(goodResult);
            var goodResp = Assert.IsType<CashfreeOrderCreationResponse>(okObj.Value);
            Assert.True(goodResp.Success);
            Assert.Equal("session_guest_success", goodResp.PaymentSessionId);
        }

        [Fact]
        public async Task Test15_Client_Supplied_NotifyUrl_Is_Ignored_In_Favor_Of_Server_Config()
        {
            var db = CreateInMemoryDbContext("TestDb_15");
            var order = new Order
            {
                Id = 116,
                OrderNumber = "ORD-116",
                FinalAmount = 2200m,
                PaymentStatus = "Pending",
                Status = "Processing",
                Customer = new Customer { Id = 60, Name = "Security User", Email = "sec@test.com", Phone = "9999999999" }
            };
            db.Orders.Add(order);
            await db.SaveChangesAsync();

            string? capturedBody = null;
            var mockHandler = new MockHttpMessageHandler(req =>
            {
                capturedBody = req.Content!.ReadAsStringAsync().Result;
                var responsePayload = new CashfreePgOrderResponse
                {
                    PaymentSessionId = "session_webhook_secure",
                    OrderStatus = "ACTIVE"
                };
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(JsonSerializer.Serialize(responsePayload), Encoding.UTF8, "application/json")
                };
            });

            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP" },
                { "Cashfree:SecretKey", "TEST_SECRET" },
                { "Cashfree:NotifyUrl", "https://drab-smoking-unstaffed.ngrok-free.dev/api/Payment/cashfree-webhook" }
            });

            var service = new CashfreeService(new HttpClient(mockHandler), config, NullLogger<CashfreeService>.Instance, db);

            // Attempt to supply malicious notifyUrl
            var result = await service.CreatePaymentOrderAsync(order, notifyUrl: "https://attacker-controlled.site/steal-webhook");
            Assert.True(result.Success);
            Assert.NotNull(capturedBody);

            // Must use the server configuration, never the client attacker URL
            Assert.Contains("drab-smoking-unstaffed.ngrok-free.dev", capturedBody);
            Assert.DoesNotContain("attacker-controlled.site", capturedBody);
        }

        [Fact]
        public async Task Test16_FinalAmount_Is_Not_Recalculated_When_Already_Persisted()
        {
            var db = CreateInMemoryDbContext("TestDb_16");
            var persistedAmount = 2500m;
            var order = new Order
            {
                Id = 117,
                OrderNumber = "ORD-117",
                TotalAmount = persistedAmount,
                FinalAmount = persistedAmount, // Tax-inclusive order where FinalAmount == TotalAmount
                PaymentStatus = "Pending",
                Status = "Processing",
                GuestToken = "guest_tok_117",
                Customer = new Customer { Id = 70, Name = "Exact Amount Client", Email = "exact@client.com", Phone = "9999999999" }
            };
            db.Orders.Add(order);
            await db.SaveChangesAsync();

            decimal dispatchedAmount = 0;
            var mockHandler = new MockHttpMessageHandler(req =>
            {
                var content = req.Content!.ReadAsStringAsync().Result;
                var payload = JsonSerializer.Deserialize<CashfreePgCreateOrderPayload>(content);
                dispatchedAmount = payload!.OrderAmount;

                var responsePayload = new CashfreePgOrderResponse
                {
                    PaymentSessionId = "session_exact_amount",
                    OrderStatus = "ACTIVE"
                };
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(JsonSerializer.Serialize(responsePayload), Encoding.UTF8, "application/json")
                };
            });

            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP" },
                { "Cashfree:SecretKey", "TEST_SECRET" }
            });

            var service = new CashfreeService(new HttpClient(mockHandler), config, NullLogger<CashfreeService>.Instance, db);
            var controller = new PaymentController(db, service, NullLogger<PaymentController>.Instance);

            var actionResult = await controller.CreateCashfreeOrder(new CreateCashfreePaymentOrderRequest
            {
                OrderId = "117",
                CustomerEmail = "exact@client.com",
                CustomerPhone = "9999999999",
                GuestToken = "guest_tok_117"
            });

            Assert.IsType<OkObjectResult>(actionResult);
            // Amount must remain exactly 2500m, NOT re-taxed to 2950m
            Assert.Equal(persistedAmount, dispatchedAmount);
        }

        private string ComputeCashfreeSignature(string timestamp, string rawBody, string secretKey)
        {
            var message = timestamp + rawBody;
            using var hmac = new System.Security.Cryptography.HMACSHA256(Encoding.UTF8.GetBytes(secretKey));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(message));
            return Convert.ToBase64String(hash);
        }

        private ControllerContext CreateHttpContextWithWebhook(string rawBody, string? signature, string? timestamp)
        {
            var httpContext = new DefaultHttpContext();
            if (signature != null)
            {
                httpContext.Request.Headers["x-webhook-signature"] = signature;
            }
            if (timestamp != null)
            {
                httpContext.Request.Headers["x-webhook-timestamp"] = timestamp;
            }
            httpContext.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(rawBody));
            return new ControllerContext { HttpContext = httpContext };
        }

        [Fact]
        public async Task Test17_Valid_Payment_Success_Webhook_Verifies_Order_And_Avoids_Double_Stock_Deduction()
        {
            var db = CreateInMemoryDbContext("TestDb_17");
            var product = new Product { Id = 101, ProductName = "Sensor A", BasePrice = 600m, Stock = 15 };
            db.Products.Add(product);

            var order = new Order
            {
                Id = 201,
                OrderNumber = "ORD-201",
                TotalAmount = 1200m,
                FinalAmount = 1200m,
                PaymentStatus = "Pending",
                Status = "Pending",
                Customer = new Customer { Id = 81, Name = "Webhook Tester", Email = "webhook@test.com", Phone = "9876543210" },
                Items = new List<OrderItem>
                {
                    new OrderItem { Id = 301, OrderId = 201, ProductId = 101, ProductName = "Sensor A", Quantity = 2, Price = 600m, Subtotal = 1200m }
                }
            };
            db.Orders.Add(order);

            var tx = new PaymentTransaction
            {
                Id = 401,
                OrderId = 201,
                OrderNumber = "ORD-201",
                CfOrderId = "cf_order_201",
                Gateway = "Cashfree",
                Amount = 1200m,
                Currency = "INR",
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };
            db.PaymentTransactions.Add(tx);
            await db.SaveChangesAsync();

            var secretKey = "TEST_SECRET_KEY_17";
            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP_17" },
                { "Cashfree:SecretKey", secretKey }
            });

            var service = new CashfreeService(new HttpClient(), config, NullLogger<CashfreeService>.Instance, db);
            var controller = new PaymentController(db, service, NullLogger<PaymentController>.Instance);

            var webhookPayload = new
            {
                data = new
                {
                    order = new
                    {
                        order_id = "cf_order_201",
                        order_amount = 1200m,
                        order_currency = "INR"
                    },
                    payment = new
                    {
                        cf_payment_id = 99887766,
                        payment_status = "SUCCESS",
                        payment_amount = 1200m,
                        payment_currency = "INR",
                        payment_message = "Transaction Successful",
                        payment_time = DateTime.UtcNow.ToString("o"),
                        bank_reference = "HDFC12345678",
                        payment_group = "upi"
                    }
                },
                event_time = DateTime.UtcNow.ToString("o"),
                type = "PAYMENT_SUCCESS_WEBHOOK"
            };

            var rawBody = JsonSerializer.Serialize(webhookPayload);
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
            var signature = ComputeCashfreeSignature(timestamp, rawBody, secretKey);

            controller.ControllerContext = CreateHttpContextWithWebhook(rawBody, signature, timestamp);

            var result = await controller.HandleCashfreeWebhook();
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(200, objectResult.StatusCode);

            // Verify order state updated to Paid and Processing
            var updatedOrder = await db.Orders.FindAsync(201);
            Assert.NotNull(updatedOrder);
            Assert.Equal("Paid", updatedOrder.PaymentStatus);
            Assert.Equal("Processing", updatedOrder.Status);
            Assert.Contains("Cashfree", updatedOrder.PaymentMethod);

            // Verify transaction updated with bank reference and payment id
            var updatedTx = await db.PaymentTransactions.FindAsync(401);
            Assert.NotNull(updatedTx);
            Assert.Equal("Success", updatedTx.Status);
            Assert.Equal("99887766", updatedTx.CfPaymentId);
            Assert.Equal("HDFC12345678", updatedTx.BankReference);
            Assert.Equal("PAYMENT_SUCCESS_WEBHOOK", updatedTx.WebhookEventType);
            Assert.NotNull(updatedTx.VerifiedAt);

            // Verify product stock was NOT deducted again (remains 15)
            var updatedProduct = await db.Products.FindAsync(101);
            Assert.NotNull(updatedProduct);
            Assert.Equal(15, updatedProduct.Stock);

            // Verify audit tracking log recorded
            var trackingLog = await db.OrderTrackingLogs.FirstOrDefaultAsync(l => l.OrderId == 201);
            Assert.NotNull(trackingLog);
            Assert.Contains("Cashfree Webhook", trackingLog.Description);
        }

        [Fact]
        public async Task Test18_Invalid_Webhook_Signature_Or_Tampered_Body_Returns_401_And_Does_Not_Change_Status()
        {
            var db = CreateInMemoryDbContext("TestDb_18");
            var order = new Order
            {
                Id = 202,
                OrderNumber = "ORD-202",
                TotalAmount = 500m,
                FinalAmount = 500m,
                PaymentStatus = "Pending",
                Status = "Pending",
                Customer = new Customer { Id = 87, Name = "Dropped Client", Email = "dropped@test.com", Phone = "9876543210" }
            };
            db.Orders.Add(order);

            var tx = new PaymentTransaction
            {
                Id = 402,
                OrderId = 202,
                OrderNumber = "ORD-202",
                CfOrderId = "cf_order_202",
                Gateway = "Cashfree",
                Amount = 500m,
                Currency = "INR",
                Status = "Pending"
            };
            db.PaymentTransactions.Add(tx);
            await db.SaveChangesAsync();

            var secretKey = "REAL_SECRET_KEY";
            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP" },
                { "Cashfree:SecretKey", secretKey }
            });

            var service = new CashfreeService(new HttpClient(), config, NullLogger<CashfreeService>.Instance, db);
            var controller = new PaymentController(db, service, NullLogger<PaymentController>.Instance);

            var webhookPayload = new
            {
                data = new
                {
                    order = new { order_id = "cf_order_202", order_amount = 500m, order_currency = "INR" },
                    payment = new { cf_payment_id = 111, payment_status = "SUCCESS", payment_amount = 500m, payment_currency = "INR" }
                },
                type = "PAYMENT_SUCCESS_WEBHOOK"
            };

            var rawBody = JsonSerializer.Serialize(webhookPayload);
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
            // Tampered signature
            var invalidSignature = "INVALID_TAMPERED_BASE64_SIGNATURE==";

            controller.ControllerContext = CreateHttpContextWithWebhook(rawBody, invalidSignature, timestamp);

            var result = await controller.HandleCashfreeWebhook();
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(401, objectResult.StatusCode);

            // Assert status was not touched
            var untouchedOrder = await db.Orders.FindAsync(202);
            Assert.NotNull(untouchedOrder);
            Assert.Equal("Pending", untouchedOrder.PaymentStatus);
        }

        [Fact]
        public async Task Test19_Missing_Webhook_Signature_Or_Timestamp_Returns_400()
        {
            var db = CreateInMemoryDbContext("TestDb_19");
            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP" },
                { "Cashfree:SecretKey", "SECRET" }
            });

            var service = new CashfreeService(new HttpClient(), config, NullLogger<CashfreeService>.Instance, db);
            var controller = new PaymentController(db, service, NullLogger<PaymentController>.Instance);

            var rawBody = "{\"some\":\"json\"}";
            // Missing signature header
            controller.ControllerContext = CreateHttpContextWithWebhook(rawBody, signature: null, timestamp: "123456789");

            var result = await controller.HandleCashfreeWebhook();
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task Test20_Duplicate_Webhook_Delivery_Is_Handled_Idempotently()
        {
            var db = CreateInMemoryDbContext("TestDb_20");
            var order = new Order
            {
                Id = 204,
                OrderNumber = "ORD-204",
                TotalAmount = 800m,
                FinalAmount = 800m,
                PaymentStatus = "Pending",
                Status = "Pending",
                Customer = new Customer { Id = 84, Name = "Dup Client", Email = "dup@test.com", Phone = "9876543210" }
            };
            db.Orders.Add(order);

            var tx = new PaymentTransaction
            {
                Id = 404,
                OrderId = 204,
                OrderNumber = "ORD-204",
                CfOrderId = "cf_order_204",
                Gateway = "Cashfree",
                Amount = 800m,
                Currency = "INR",
                Status = "Pending"
            };
            db.PaymentTransactions.Add(tx);
            await db.SaveChangesAsync();

            var secretKey = "SECRET_20";
            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP_20" },
                { "Cashfree:SecretKey", secretKey }
            });

            var service = new CashfreeService(new HttpClient(), config, NullLogger<CashfreeService>.Instance, db);
            var controller = new PaymentController(db, service, NullLogger<PaymentController>.Instance);

            var webhookPayload = new
            {
                data = new
                {
                    order = new { order_id = "cf_order_204", order_amount = 800m, order_currency = "INR" },
                    payment = new { cf_payment_id = 999111, payment_status = "SUCCESS", payment_amount = 800m, payment_currency = "INR" }
                },
                type = "PAYMENT_SUCCESS_WEBHOOK"
            };

            var rawBody = JsonSerializer.Serialize(webhookPayload);
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
            var signature = ComputeCashfreeSignature(timestamp, rawBody, secretKey);

            // First delivery
            controller.ControllerContext = CreateHttpContextWithWebhook(rawBody, signature, timestamp);
            var firstResult = await controller.HandleCashfreeWebhook();
            var firstObj = Assert.IsType<ObjectResult>(firstResult);
            Assert.Equal(200, firstObj.StatusCode);

            // Second delivery (duplicate retry by Cashfree)
            controller.ControllerContext = CreateHttpContextWithWebhook(rawBody, signature, timestamp);
            var secondResult = await controller.HandleCashfreeWebhook();
            var secondObj = Assert.IsType<ObjectResult>(secondResult);
            Assert.Equal(200, secondObj.StatusCode);

            // Assert order is paid, and only 1 tracking log exists
            var logs = await db.OrderTrackingLogs.Where(l => l.OrderId == 204).ToListAsync();
            Assert.Single(logs);
        }

        [Fact]
        public async Task Test21_OutOfOrder_Failed_Webhook_Does_Not_Overwrite_Paid_Order()
        {
            var db = CreateInMemoryDbContext("TestDb_21");
            var order = new Order
            {
                Id = 205,
                OrderNumber = "ORD-205",
                TotalAmount = 950m,
                FinalAmount = 950m,
                PaymentStatus = "Paid",
                Status = "Processing"
            };
            db.Orders.Add(order);

            var tx = new PaymentTransaction
            {
                Id = 405,
                OrderId = 205,
                OrderNumber = "ORD-205",
                CfOrderId = "cf_order_205",
                Gateway = "Cashfree",
                Amount = 950m,
                Currency = "INR",
                Status = "Success"
            };
            db.PaymentTransactions.Add(tx);
            await db.SaveChangesAsync();

            var secretKey = "SECRET_21";
            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP_21" },
                { "Cashfree:SecretKey", secretKey }
            });

            var service = new CashfreeService(new HttpClient(), config, NullLogger<CashfreeService>.Instance, db);
            var controller = new PaymentController(db, service, NullLogger<PaymentController>.Instance);

            var failedPayload = new
            {
                data = new
                {
                    order = new { order_id = "cf_order_205", order_amount = 950m, order_currency = "INR" },
                    payment = new { cf_payment_id = 999222, payment_status = "FAILED", payment_amount = 950m, payment_currency = "INR", payment_message = "Bank timeout" }
                },
                type = "PAYMENT_FAILED_WEBHOOK"
            };

            var rawBody = JsonSerializer.Serialize(failedPayload);
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
            var signature = ComputeCashfreeSignature(timestamp, rawBody, secretKey);

            controller.ControllerContext = CreateHttpContextWithWebhook(rawBody, signature, timestamp);
            var result = await controller.HandleCashfreeWebhook();
            var objResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(200, objResult.StatusCode);

            // Assert order payment status is NOT downgraded to Failed
            var checkedOrder = await db.Orders.FindAsync(205);
            Assert.NotNull(checkedOrder);
            Assert.Equal("Paid", checkedOrder.PaymentStatus);

            var checkedTx = await db.PaymentTransactions.FindAsync(405);
            Assert.NotNull(checkedTx);
            Assert.Equal("Success", checkedTx.Status);
        }

        [Fact]
        public async Task Test22_Webhook_Amount_Mismatch_Rejects_Paid_Transition_And_Flags_Mismatch()
        {
            var db = CreateInMemoryDbContext("TestDb_22");
            var order = new Order
            {
                Id = 206,
                OrderNumber = "ORD-206",
                TotalAmount = 2500m,
                FinalAmount = 2500m,
                PaymentStatus = "Pending",
                Status = "Pending",
                Customer = new Customer { Id = 86, Name = "Mismatch Client", Email = "mismatch@test.com", Phone = "9876543210" }
            };
            db.Orders.Add(order);

            var tx = new PaymentTransaction
            {
                Id = 406,
                OrderId = 206,
                OrderNumber = "ORD-206",
                CfOrderId = "cf_order_206",
                Gateway = "Cashfree",
                Amount = 2500m,
                Currency = "INR",
                Status = "Pending"
            };
            db.PaymentTransactions.Add(tx);
            await db.SaveChangesAsync();

            var secretKey = "SECRET_22";
            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP_22" },
                { "Cashfree:SecretKey", secretKey }
            });

            var service = new CashfreeService(new HttpClient(), config, NullLogger<CashfreeService>.Instance, db);
            var controller = new PaymentController(db, service, NullLogger<PaymentController>.Instance);

            // Payload with mismatched amount (100 INR instead of 2500 INR)
            var mismatchPayload = new
            {
                data = new
                {
                    order = new { order_id = "cf_order_206", order_amount = 100m, order_currency = "INR" },
                    payment = new { cf_payment_id = 999333, payment_status = "SUCCESS", payment_amount = 100m, payment_currency = "INR" }
                },
                type = "PAYMENT_SUCCESS_WEBHOOK"
            };

            var rawBody = JsonSerializer.Serialize(mismatchPayload);
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
            var signature = ComputeCashfreeSignature(timestamp, rawBody, secretKey);

            controller.ControllerContext = CreateHttpContextWithWebhook(rawBody, signature, timestamp);
            var result = await controller.HandleCashfreeWebhook();
            var objResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(400, objResult.StatusCode);

            // Assert order was NOT marked Paid
            var checkedOrder = await db.Orders.FindAsync(206);
            Assert.NotNull(checkedOrder);
            Assert.Equal("Pending", checkedOrder.PaymentStatus);

            // Assert transaction was marked AmountMismatch
            var checkedTx = await db.PaymentTransactions.FindAsync(406);
            Assert.NotNull(checkedTx);
            Assert.Equal("AmountMismatch", checkedTx.Status);
        }

        [Fact]
        public async Task Test23_Payment_Failed_And_User_Dropped_Webhooks_Record_Status_Without_Premature_Cancellation()
        {
            var db = CreateInMemoryDbContext("TestDb_23");
            var order = new Order
            {
                Id = 207,
                OrderNumber = "ORD-207",
                TotalAmount = 750m,
                FinalAmount = 750m,
                PaymentStatus = "Pending",
                Status = "Pending",
                Customer = new Customer { Id = 87, Name = "Dropped Client", Email = "dropped@test.com", Phone = "9876543210" }
            };
            db.Orders.Add(order);

            var tx = new PaymentTransaction
            {
                Id = 407,
                OrderId = 207,
                OrderNumber = "ORD-207",
                CfOrderId = "cf_order_207",
                Gateway = "Cashfree",
                Amount = 750m,
                Currency = "INR",
                Status = "Pending"
            };
            db.PaymentTransactions.Add(tx);
            await db.SaveChangesAsync();

            var secretKey = "SECRET_23";
            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP_23" },
                { "Cashfree:SecretKey", secretKey }
            });

            var service = new CashfreeService(new HttpClient(), config, NullLogger<CashfreeService>.Instance, db);
            var controller = new PaymentController(db, service, NullLogger<PaymentController>.Instance);

            var userDroppedPayload = new
            {
                data = new
                {
                    order = new { order_id = "cf_order_207", order_amount = 750m, order_currency = "INR" },
                    payment = new { cf_payment_id = 999444, payment_status = "USER_DROPPED", payment_amount = 750m, payment_currency = "INR" }
                },
                type = "PAYMENT_USER_DROPPED_WEBHOOK"
            };

            var rawBody = JsonSerializer.Serialize(userDroppedPayload);
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
            var signature = ComputeCashfreeSignature(timestamp, rawBody, secretKey);

            controller.ControllerContext = CreateHttpContextWithWebhook(rawBody, signature, timestamp);
            var result = await controller.HandleCashfreeWebhook();
            var objResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(200, objResult.StatusCode);

            // Assert order status is still Pending (not hard cancelled) so customer can retry checkout
            var checkedOrder = await db.Orders.FindAsync(207);
            Assert.NotNull(checkedOrder);
            Assert.Equal("Pending", checkedOrder.Status);

            var checkedTx = await db.PaymentTransactions.FindAsync(407);
            Assert.NotNull(checkedTx);
            Assert.Equal("UserDropped", checkedTx.Status);
        }

        [Fact]
        public async Task Test24_Server_Verification_Reconciles_Order_When_Webhook_Dropped()
        {
            var db = CreateInMemoryDbContext("TestDb_24");
            var order = new Order
            {
                Id = 208,
                OrderNumber = "ORD-208",
                TotalAmount = 1450m,
                FinalAmount = 1450m,
                PaymentStatus = "Pending",
                Status = "Pending",
                GuestToken = "guest_tok_208",
                Customer = new Customer { Id = 88, Name = "Reconcile User", Email = "reconcile@test.com", Phone = "9876543210" }
            };
            db.Orders.Add(order);

            var tx = new PaymentTransaction
            {
                Id = 408,
                OrderId = 208,
                OrderNumber = "ORD-208",
                CfOrderId = "cf_order_208",
                Gateway = "Cashfree",
                Amount = 1450m,
                Currency = "INR",
                Status = "Pending"
            };
            db.PaymentTransactions.Add(tx);
            await db.SaveChangesAsync();

            var mockHandler = new MockHttpMessageHandler(req =>
            {
                var uri = req.RequestUri?.ToString() ?? "";
                if (uri.Contains("/payments"))
                {
                    var paymentList = new List<CashfreePgPaymentEntity>
                    {
                        new CashfreePgPaymentEntity
                        {
                            CfPaymentId = 776655,
                            PaymentStatus = "SUCCESS",
                            PaymentAmount = 1450m,
                            PaymentCurrency = "INR",
                            BankReference = "HDFC778899",
                            PaymentGroup = "netbanking"
                        }
                    };
                    return new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(JsonSerializer.Serialize(paymentList), Encoding.UTF8, "application/json")
                    };
                }
                else
                {
                    var orderObj = new CashfreePgOrderResponse
                    {
                        CfOrderId = "cf_order_208",
                        OrderId = "cf_order_208",
                        OrderStatus = "PAID",
                        OrderAmount = 1450m,
                        OrderCurrency = "INR"
                    };
                    return new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(JsonSerializer.Serialize(orderObj), Encoding.UTF8, "application/json")
                    };
                }
            });

            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP_24" },
                { "Cashfree:SecretKey", "TEST_SECRET_24" }
            });

            var service = new CashfreeService(new HttpClient(mockHandler), config, NullLogger<CashfreeService>.Instance, db);
            var controller = new PaymentController(db, service, NullLogger<PaymentController>.Instance);

            // Customer verification call with matching guest email and valid guest token
            var actionResult = await controller.VerifyCashfreeOrderPayment("ORD-208", customerEmail: "reconcile@test.com", customerPhone: "9876543210", guestToken: "guest_tok_208");
            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var resultValue = Assert.IsType<CashfreePaymentVerificationResult>(okResult.Value);

            Assert.True(resultValue.Success);
            Assert.True(resultValue.IsPaid);
            Assert.Equal("Paid", resultValue.Status);
            Assert.Equal("776655", resultValue.CfPaymentId);
            Assert.Equal("HDFC778899", resultValue.BankReference);

            // Confirm order in database is now marked Paid and Processing
            var updatedOrder = await db.Orders.FindAsync(208);
            Assert.NotNull(updatedOrder);
            Assert.Equal("Paid", updatedOrder.PaymentStatus);
            Assert.Equal("Processing", updatedOrder.Status);
        }

        [Fact]
        public async Task Test25_Verify_Endpoint_Enforces_Order_Ownership()
        {
            var db = CreateInMemoryDbContext("TestDb_25");
            var order = new Order
            {
                Id = 209,
                OrderNumber = "ORD-209",
                TotalAmount = 300m,
                FinalAmount = 300m,
                PaymentStatus = "Pending",
                Status = "Pending",
                GuestToken = "guest_secure_token_209",
                Customer = new Customer { Id = 89, Name = "Legit Customer", Email = "legit@domain.com", Phone = "9876543210" }
            };
            db.Orders.Add(order);

            var tx = new PaymentTransaction
            {
                Id = 409,
                OrderId = 209,
                OrderNumber = "ORD-209",
                CfOrderId = "cf_order_209",
                Gateway = "Cashfree",
                Amount = 300m,
                Currency = "INR",
                Status = "Pending"
            };
            db.PaymentTransactions.Add(tx);
            await db.SaveChangesAsync();

            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP_25" },
                { "Cashfree:SecretKey", "TEST_SECRET_25" }
            });

            var service = new CashfreeService(new HttpClient(), config, NullLogger<CashfreeService>.Instance, db);
            var controller = new PaymentController(db, service, NullLogger<PaymentController>.Instance);

            // 1. Attacker guessing email and phone without GuestToken -> 403 Forbidden
            var guessResult = await controller.VerifyCashfreeOrderPayment("ORD-209", customerEmail: "legit@domain.com", customerPhone: "9876543210");
            var objResult1 = Assert.IsType<ObjectResult>(guessResult);
            Assert.Equal(StatusCodes.Status403Forbidden, objResult1.StatusCode);

            // 2. Attacker providing wrong GuestToken -> 403 Forbidden
            var forgedResult = await controller.VerifyCashfreeOrderPayment("ORD-209", customerEmail: "legit@domain.com", customerPhone: "9876543210", guestToken: "wrong_token");
            var objResult2 = Assert.IsType<ObjectResult>(forgedResult);
            Assert.Equal(StatusCodes.Status403Forbidden, objResult2.StatusCode);
        }

        [Fact]
        public void Test26_Timing_Safe_HMAC_Verification_Formula()
        {
            var db = CreateInMemoryDbContext("TestDb_26");
            var secretKey = "CashfreeSecretKeyTest123456";
            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP_26" },
                { "Cashfree:SecretKey", secretKey }
            });

            var service = new CashfreeService(new HttpClient(), config, NullLogger<CashfreeService>.Instance, db);

            var rawBody = "{\"data\":{\"order\":{\"order_id\":\"cf_123\"}}}";
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();

            // Official formula: Base64(HMAC-SHA256(timestamp + rawBody, secretKey))
            var message = timestamp + rawBody;
            using var hmac = new System.Security.Cryptography.HMACSHA256(Encoding.UTF8.GetBytes(secretKey));
            var validSignature = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(message)));

            // Valid signature within 5 minutes passes
            Assert.True(service.VerifyWebhookSignature(rawBody, timestamp, validSignature));

            // Tampered body fails
            Assert.False(service.VerifyWebhookSignature(rawBody + " ", timestamp, validSignature));

            // Tampered timestamp fails
            Assert.False(service.VerifyWebhookSignature(rawBody, (long.Parse(timestamp) + 1).ToString(), validSignature));

            // Wrong secret fails
            using var wrongHmac = new System.Security.Cryptography.HMACSHA256(Encoding.UTF8.GetBytes("WrongSecret"));
            var wrongSignature = Convert.ToBase64String(wrongHmac.ComputeHash(Encoding.UTF8.GetBytes(message)));
            Assert.False(service.VerifyWebhookSignature(rawBody, timestamp, wrongSignature));
        }

        [Fact]
        public async Task Test27_Production_Credentials_In_Sandbox_Throws_InvalidOperationException()
        {
            var db = CreateInMemoryDbContext("TestDb_27");
            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP" },
                { "Cashfree:SecretKey", "cfsk_ma_prod_unauthorized_key" },
                { "Cashfree:Environment", "sandbox" }
            });

            var service = new CashfreeService(new HttpClient(), config, NullLogger<CashfreeService>.Instance, db);
            var order = new Order { Id = 301, OrderNumber = "ORD-301", FinalAmount = 1000m, Customer = new Customer { Email = "test@user.com", Phone = "9999999999" } };

            await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreatePaymentOrderAsync(order));
        }

        [Fact]
        public async Task Test28_Exact_Paise_Amount_Mismatch_Is_Rejected()
        {
            var db = CreateInMemoryDbContext("TestDb_28");
            var order = new Order
            {
                Id = 302,
                OrderNumber = "ORD-302",
                TotalAmount = 1200.00m,
                FinalAmount = 1200.00m,
                PaymentStatus = "Pending",
                Status = "Pending",
                PaymentMethod = "Cashfree",
                Customer = new Customer { Id = 91, Name = "Exact User", Email = "exact@test.com", Phone = "9876543210" }
            };
            db.Orders.Add(order);

            var tx = new PaymentTransaction
            {
                Id = 502,
                OrderId = 302,
                OrderNumber = "ORD-302",
                CfOrderId = "cf_order_302",
                Gateway = "Cashfree",
                Amount = 1200.00m,
                Currency = "INR",
                Status = "Pending"
            };
            db.PaymentTransactions.Add(tx);
            await db.SaveChangesAsync();

            var secretKey = "TEST_SECRET";
            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP" },
                { "Cashfree:SecretKey", secretKey }
            });

            var service = new CashfreeService(new HttpClient(), config, NullLogger<CashfreeService>.Instance, db);

            // Mismatched by even 5 paise (1200.05m vs 1200.00m)
            var webhookPayload = new
            {
                data = new
                {
                    order = new { order_id = "cf_order_302", order_amount = 1200.05m, order_currency = "INR" },
                    payment = new { cf_payment_id = 99887711, payment_status = "SUCCESS", payment_amount = 1200.05m, payment_currency = "INR" }
                },
                type = "PAYMENT_SUCCESS_WEBHOOK"
            };

            var rawBody = JsonSerializer.Serialize(webhookPayload);
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
            var signature = ComputeCashfreeSignature(timestamp, rawBody, secretKey);

            var result = await service.ProcessWebhookAsync(rawBody, timestamp, signature);

            Assert.False(result.Success);
            Assert.Equal(400, result.StatusCode);
            Assert.Contains("amount does not match", result.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public void Test29_Replay_Attack_Webhook_Timestamp_Older_Than_5_Minutes_Rejected()
        {
            var db = CreateInMemoryDbContext("TestDb_29");
            var secretKey = "CashfreeSecretKeyTest123456";
            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP_29" },
                { "Cashfree:SecretKey", secretKey }
            });

            var service = new CashfreeService(new HttpClient(), config, NullLogger<CashfreeService>.Instance, db);

            var rawBody = "{\"data\":{\"order\":{\"order_id\":\"cf_replay_test\"}}}";
            // Timestamp from 10 minutes ago
            var expiredTimestamp = DateTimeOffset.UtcNow.AddMinutes(-10).ToUnixTimeSeconds().ToString();

            var message = expiredTimestamp + rawBody;
            using var hmac = new System.Security.Cryptography.HMACSHA256(Encoding.UTF8.GetBytes(secretKey));
            var validSignature = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(message)));

            // Even with valid HMAC signature, expired timestamp MUST be rejected!
            Assert.False(service.VerifyWebhookSignature(rawBody, expiredTimestamp, validSignature));
        }

        [Fact]
        public async Task Test30_Expired_Inventory_Reservations_Are_Released()
        {
            var db = CreateInMemoryDbContext("TestDb_30");
            var product = new Product { Id = 601, ProductName = "Expired Sensor", Stock = 10, BasePrice = 500m };
            db.Products.Add(product);

            var expiredOrder = new Order
            {
                Id = 303,
                OrderNumber = "ORD-303",
                TotalAmount = 1000m,
                FinalAmount = 1000m,
                PaymentStatus = "Pending",
                Status = "Pending",
                PaymentMethod = "Cashfree",
                OrderDate = DateTime.UtcNow.AddMinutes(-90), // 90 min old
                Items = new List<OrderItem>
                {
                    new OrderItem { Id = 701, OrderId = 303, ProductId = 601, ProductName = "Expired Sensor", Quantity = 4, Price = 500m, Subtotal = 1000m }
                }
            };
            db.Orders.Add(expiredOrder);
            await db.SaveChangesAsync();

            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP" },
                { "Cashfree:SecretKey", "TEST_SECRET" }
            });

            var service = new CashfreeService(new HttpClient(), config, NullLogger<CashfreeService>.Instance, db);

            // Reconcile with 60 minute threshold
            var releasedCount = await service.ReleaseExpiredInventoryReservationsAsync(TimeSpan.FromMinutes(60));
            Assert.Equal(1, releasedCount);

            // Verify order was marked Expired
            var cancelledOrder = await db.Orders.FindAsync(303);
            Assert.NotNull(cancelledOrder);
            Assert.Equal("Expired", cancelledOrder.Status);

            // Verify product stock was restored from 10 to 14
            var restoredProduct = await db.Products.FindAsync(601);
            Assert.NotNull(restoredProduct);
            Assert.Equal(14, restoredProduct.Stock);
        }

        [Fact]
        public async Task Test31_Active_Payment_Attempt_Prevents_Premature_Stock_Release()
        {
            var db = CreateInMemoryDbContext("TestDb_31");
            var product = new Product { Id = 602, ProductName = "Active Product", Stock = 10, BasePrice = 500m };
            db.Products.Add(product);

            var order = new Order
            {
                Id = 304,
                OrderNumber = "ORD-304",
                TotalAmount = 500m,
                FinalAmount = 500m,
                PaymentStatus = "Pending",
                Status = "Pending",
                PaymentMethod = "Cashfree",
                OrderDate = DateTime.UtcNow.AddMinutes(-90), // Order created 90 min ago
                Items = new List<OrderItem>
                {
                    new OrderItem { Id = 702, OrderId = 304, ProductId = 602, ProductName = "Active Product", Quantity = 2, Price = 500m, Subtotal = 500m }
                }
            };
            db.Orders.Add(order);

            // But customer has an active payment attempt initiated 5 minutes ago!
            var recentTx = new PaymentTransaction
            {
                Id = 801,
                OrderId = 304,
                OrderNumber = "ORD-304",
                CfOrderId = "cf_active_304",
                Gateway = "Cashfree",
                Amount = 500m,
                Currency = "INR",
                Status = "Pending",
                CreatedAt = DateTime.UtcNow.AddMinutes(-5) // Active attempt within 15 min!
            };
            db.PaymentTransactions.Add(recentTx);
            await db.SaveChangesAsync();

            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP" },
                { "Cashfree:SecretKey", "TEST_SECRET" }
            });

            var service = new CashfreeService(new HttpClient(), config, NullLogger<CashfreeService>.Instance, db);

            // Attempt to release expired reservations
            var releasedCount = await service.ReleaseExpiredInventoryReservationsAsync(TimeSpan.FromMinutes(60));
            Assert.Equal(0, releasedCount); // Order must NOT be released!

            var keptOrder = await db.Orders.FindAsync(304);
            Assert.NotNull(keptOrder);
            Assert.Equal("Pending", keptOrder.Status);

            var unchangedProduct = await db.Products.FindAsync(602);
            Assert.NotNull(unchangedProduct);
            Assert.Equal(10, unchangedProduct.Stock);
        }

        [Fact]
        public async Task Test32_Late_Payment_Webhook_Reallocates_Stock_Or_Flags_For_Review()
        {
            var db = CreateInMemoryDbContext("TestDb_32");
            var product = new Product { Id = 603, ProductName = "Late Item", Stock = 0, BasePrice = 1000m }; // Out of stock!
            db.Products.Add(product);

            var cancelledOrder = new Order
            {
                Id = 305,
                OrderNumber = "ORD-305",
                TotalAmount = 1000m,
                FinalAmount = 1000m,
                PaymentStatus = "Pending",
                Status = "Expired", // Expired reservation
                PaymentMethod = "Cashfree",
                OrderDate = DateTime.UtcNow.AddMinutes(-120),
                Items = new List<OrderItem>
                {
                    new OrderItem { Id = 703, OrderId = 305, ProductId = 603, ProductName = "Late Item", Quantity = 1, Price = 1000m, Subtotal = 1000m }
                }
            };
            db.Orders.Add(cancelledOrder);

            var tx = new PaymentTransaction
            {
                Id = 802,
                OrderId = 305,
                OrderNumber = "ORD-305",
                CfOrderId = "cf_order_305",
                Gateway = "Cashfree",
                Amount = 1000m,
                Currency = "INR",
                Status = "Pending",
                CreatedAt = DateTime.UtcNow.AddMinutes(-70)
            };
            db.PaymentTransactions.Add(tx);
            await db.SaveChangesAsync();

            var secretKey = "TEST_SECRET";
            var config = CreateConfiguration(new Dictionary<string, string?>
            {
                { "Cashfree:AppId", "TEST_APP" },
                { "Cashfree:SecretKey", secretKey }
            });

            var service = new CashfreeService(new HttpClient(), config, NullLogger<CashfreeService>.Instance, db);

            // Payment success arrives late for the expired order
            var webhookPayload = new
            {
                data = new
                {
                    order = new { order_id = "cf_order_305", order_amount = 1000m, order_currency = "INR" },
                    payment = new
                    {
                        cf_payment_id = 11223344,
                        payment_status = "SUCCESS",
                        payment_amount = 1000m,
                        payment_currency = "INR",
                        bank_reference = "HDFC_LATE_123"
                    }
                },
                type = "PAYMENT_SUCCESS_WEBHOOK"
            };

            var rawBody = JsonSerializer.Serialize(webhookPayload);
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
            var signature = ComputeCashfreeSignature(timestamp, rawBody, secretKey);

            var result = await service.ProcessWebhookAsync(rawBody, timestamp, signature);

            Assert.True(result.Success);
            Assert.Equal(200, result.StatusCode);

            // Because stock was 0, order must be flagged RequiresReview
            var reviewOrder = await db.Orders.FindAsync(305);
            Assert.NotNull(reviewOrder);
            Assert.Equal("Paid", reviewOrder.PaymentStatus);
            Assert.Equal("RequiresReview", reviewOrder.Status);

            // Confirm tracking log recorded the review requirement
            var log = await db.OrderTrackingLogs.FirstOrDefaultAsync(l => l.OrderId == 305 && l.Status == "RequiresReview");
            Assert.NotNull(log);
            Assert.Contains("inventory is exhausted", log.Description, StringComparison.OrdinalIgnoreCase);
        }
    }
}
