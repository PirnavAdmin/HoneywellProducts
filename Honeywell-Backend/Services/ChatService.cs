using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Honeywell.Data;
using Honeywell.DTOs.Chat;
using Honeywell.Models;
using Honeywell.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Honeywell.Services
{
    public class ChatService : IChatService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public ChatService(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
            _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
        }

        public async Task<ChatConfigDto> GetChatConfigAsync()
        {
            return await Task.FromResult(new ChatConfigDto());
        }

        public async Task<ChatMessageResponse> ProcessMessageAsync(ChatMessageRequest request)
        {
            var response = new ChatMessageResponse();
            var inputMsg = !string.IsNullOrWhiteSpace(request.Message) ? request.Message : (request.Prompt ?? "");
            var input = inputMsg.Trim().ToLower();

            if (string.IsNullOrEmpty(input))
            {
                SetText(response, "Hello! I am your official Honeywell Products AI Assistant. How can I help you today?");
                return response;
            }

            // 1. Try External AI (OpenAI / Gemini) if API Key is configured
            var apiKey = _configuration["AI:ApiKey"] 
                ?? Environment.GetEnvironmentVariable("AI_API_KEY") 
                ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY") 
                ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");

            if (!string.IsNullOrEmpty(apiKey) && apiKey != "YOUR_OPENAI_OR_GEMINI_API_KEY")
            {
                try
                {
                    var aiReply = await CallExternalAiApiAsync(apiKey, inputMsg);
                    if (!string.IsNullOrEmpty(aiReply))
                    {
                        SetText(response, aiReply);
                        return response;
                    }
                }
                catch
                {
                    // Fall back to dynamic DB product recommendation engine
                }
            }

            // 2. Dynamic Database Product Recommendation Engine
            var cameraKeywords = new[] { "cam", "cams", "camera", "cameras", "cctv", "ip", "surveillance", "solar", "bullet", "dome", "nvr", "dvr", "scanner", "office", "indoor", "outdoor", "home", "shop", "store" };
            
            bool isProductQuery = cameraKeywords.Any(k => input.Contains(k));

            if (isProductQuery)
            {
                var query = _context.Products
                    .Include(p => p.Category)
                    .Include(p => p.Images)
                    .AsNoTracking()
                    .Where(p => p.IsActive);

                bool isOfficeQuery = input.Contains("office") || input.Contains("indoor") || input.Contains("room") || input.Contains("workplace");
                bool isSolarQuery = input.Contains("solar") || input.Contains("energy");
                bool isSingleOptionQuery = input.Contains("only one") || input.Contains("single") || input.Contains("one cam") || input.Contains("best cam") || input.Contains("one camera") || input.Contains("suits in office") || input.Contains("recommend one");

                if (isOfficeQuery)
                {
                    query = query.Where(p => p.ProductName.Contains("Dome") || p.ProductName.Contains("Fixed") || p.ProductName.Contains("Network") || p.ProductName.Contains("Bullet") || p.ProductName.Contains("IP") || p.ProductName.Contains("CCTV") || (p.Category != null && p.Category.Name.Contains("Network")));
                }
                else if (isSolarQuery)
                {
                    query = query.Where(p => p.ProductName.Contains("Solar") || (p.ShortDescription != null && p.ShortDescription.Contains("Solar")) || (p.Category != null && p.Category.Name.Contains("Solar")));
                }

                var matchedProducts = await query.Take(4).ToListAsync();

                // If no specific office/solar match found, fallback to all active products
                if (matchedProducts.Count == 0)
                {
                    matchedProducts = await _context.Products
                        .Include(p => p.Category)
                        .Include(p => p.Images)
                        .AsNoTracking()
                        .Where(p => p.IsActive)
                        .Take(4)
                        .ToListAsync();
                }

                if (matchedProducts.Count > 0)
                {
                    response.Products = matchedProducts.Select(p => new ChatProductDto
                    {
                        Id = p.Id,
                        Name = p.ProductName,
                        Model = p.SKU,
                        Price = p.SellingPrice ?? p.MRP,
                        ImageUrl = p.Images.FirstOrDefault()?.ImageUrl ?? "",
                        Category = p.Category?.Name ?? "Security & Surveillance"
                    }).ToList();

                    if (isSingleOptionQuery || (isOfficeQuery && input.Contains("one")))
                    {
                        var topProd = matchedProducts.First();
                        decimal price = topProd.SellingPrice ?? topProd.MRP;
                        SetText(response, $"For an office environment, the recommended choice is the **{topProd.ProductName}** ({topProd.SKU}) priced at ₹{price:N0}.\n\nKey Highlights:\n• High-definition resolution with crisp video clarity\n• Discreet design suitable for office rooms, reception, & halls\n• Smart AI motion detection & night vision support\n• Easy integration with network video recorders (NVR)");
                    }
                    else
                    {
                        var topNames = string.Join(", ", matchedProducts.Select(p => p.ProductName));
                        SetText(response, $"Honeywell Security & Surveillance Cameras offer Ultra-HD resolution, PoE support, and AI motion detection.\n\nRecommended Models ({matchedProducts.Count}):\n" +
                            string.Join("\n", matchedProducts.Select(p => $"• {p.ProductName} ({p.SKU}) — ₹{p.SellingPrice ?? p.MRP:N0}")));
                    }

                    response.SuggestedActions = new List<ChatActionDto>
                    {
                        new ChatActionDto { Title = "Explore All Products", Url = "/catalog" },
                        new ChatActionDto { Title = "Request Bulk Quote", Url = "/quote" }
                    };
                    return response;
                }
            }

            // 3. Bulk Quote / Pricing Requests
            if (input.Contains("bulk") || input.Contains("quote") || input.Contains("wholesale") || input.Contains("price"))
            {
                SetText(response, "For bulk pricing and enterprise quotations, please submit a Request for Quote. Our commercial sales team will review your quantities and provide custom volume pricing within 24 hours.");
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "Get Bulk Quote", Url = "/quote" },
                    new ChatActionDto { Title = "Contact Commercial Sales", Url = "/contact" }
                };
                return response;
            }

            // 4. Distributor / Partner / Franchise
            if (input.Contains("distributor") || input.Contains("partner") || input.Contains("franchise") || input.Contains("reseller") || input.Contains("dealer"))
            {
                SetText(response, "Honeywell Products offers exciting opportunities for authorized distributors, system integrators, and channel partners. Submit your business profile through our Business Partner portal.");
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "Distributor Opportunities", Url = "/business" },
                    new ChatActionDto { Title = "Partner Benefits", Url = "/business/partner-benefits" }
                };
                return response;
            }

            // 5. Product Enquiry
            if (input.Contains("enquiry") || input.Contains("enquire") || input.Contains("demo"))
            {
                SetText(response, "You can request a product demo or submit an enquiry directly on any product details page by clicking the 'Enquire Now' button, or speak to our product specialists.");
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "View Products Catalog", Url = "/catalog" },
                    new ChatActionDto { Title = "Contact Us", Url = "/contact" }
                };
                return response;
            }

            // 6. Contact / Sales / Support
            if (input.Contains("contact") || input.Contains("sales") || input.Contains("phone") || input.Contains("email") || input.Contains("address") || input.Contains("location") || input.Contains("office"))
            {
                var config = await _context.SupportConfigs.FirstOrDefaultAsync();
                string phone = config?.SupportPhoneNumber ?? "+1 (800) 323-0194";
                string email = config?.SupportEmail ?? "support@honeywell.com";
                string timings = config?.WorkTimings ?? "Mon-Sat: 9:00 AM - 6:00 PM";

                SetText(response, $"You can reach Honeywell Products Support at {phone} or email us at {email}. Working hours: {timings}. Our headquarters: 101, Jain Sadguru Capital Park, Hitech City, Madhapur, Hyderabad - 500081, Telangana.");
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "Contact Us Page", Url = "/contact" },
                    new ChatActionDto { Title = "Support Center", Url = "/support" }
                };
                return response;
            }

            // 7. Order Tracking / Invoice / Warranty
            if (input.Contains("track") || input.Contains("order") || input.Contains("invoice") || input.Contains("warranty") || input.Contains("return"))
            {
                SetText(response, "For order tracking, invoice downloads, and warranty claims, please visit our Support Center. You can enter your Order ID to view real-time shipment status.");
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "Support Center", Url = "/support" },
                    new ChatActionDto { Title = "Tracking Policy", Url = "/support/tracking-policy" }
                };
                return response;
            }

            // 8. Greeting / Hello
            if (input.Contains("hello") || input.Contains("hi") || input.Contains("hey") || input.Contains("good morning") || input.Contains("good afternoon"))
            {
                SetText(response, "Hello! I am your official Honeywell Products & Security AI Assistant. How can I help you today? You can ask me about CCTV cameras, solar security products, bulk quotes, or partner programs.");
                return response;
            }

            // 9. General Fallback
            SetText(response, "I am here to assist you with Honeywell CCTV cameras, IP surveillance systems, solar products, bulk quotations, and dealer applications. How can I assist you further?");
            response.SuggestedActions = new List<ChatActionDto>
            {
                new ChatActionDto { Title = "Explore Products", Url = "/catalog" },
                new ChatActionDto { Title = "Contact Sales", Url = "/contact" }
            };
            return response;
        }

        private async Task<string?> CallExternalAiApiAsync(string apiKey, string userPrompt)
        {
            // OpenAI API call structure
            var requestUri = "https://api.openai.com/v1/chat/completions";
            var requestBody = new
            {
                model = "gpt-4o-mini",
                messages = new[]
                {
                    new { role = "system", content = "You are the official Honeywell Products & Security AI Assistant. Help customers with queries regarding CCTV cameras, IP cameras, solar security, bulk quotes, and distributor partnerships. Be professional, concise, and format lists with bullet points." },
                    new { role = "user", content = userPrompt }
                },
                max_tokens = 300
            };

            var json = JsonSerializer.Serialize(requestBody);
            var req = new HttpRequestMessage(HttpMethod.Post, requestUri)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
            req.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

            var res = await _httpClient.SendAsync(req);
            if (res.IsSuccessStatusCode)
            {
                var resContent = await res.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(resContent);
                var text = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
                return text;
            }
            return null;
        }

        private static void SetText(ChatMessageResponse response, string text)
        {
            response.Reply = text;
            response.Message = text;
        }
    }
}
