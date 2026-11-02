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
            _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(12) };
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

            // ── 1. Try External AI (OpenAI / Gemini) if configured ──
            var apiKey = _configuration["AI:ApiKey"]
                ?? _configuration["OpenAI:ApiKey"]
                ?? _configuration["Gemini:ApiKey"]
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
                        AttachDefaultActions(response, input);
                        return response;
                    }
                }
                catch
                {
                    // Fall through to local intelligence engine
                }
            }

            // ── 2. Greetings, Politeness & Identity ──
            if (IsExactMatch(input, new[] { "hi", "hello", "hey", "hola", "greetings", "namaste", "good morning", "good afternoon", "good evening" }))
            {
                SetText(response, "Hello! I am your official Honeywell Products AI Assistant.\n\nI can help you with:\n• Finding & comparing CCTV, IP, and Solar security cameras\n• Checking live models, prices, and technical specifications\n• Tracking orders, shipment delivery times, and invoices\n• Warranty claims, returns, and refund requests\n• Bulk quotations and authorized dealership programs\n\nWhat would you like to know today?");
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "Explore Cameras", Url = "/products" },
                    new ChatActionDto { Title = "Request Bulk Quote", Url = "/quote" }
                };
                return response;
            }

            if (input.Contains("thank") || input.Contains("thx") || input.Contains("appreciate") || input == "ok" || input == "great" || input == "cool" || input == "awesome")
            {
                SetText(response, "You're very welcome! If you have any more questions about Honeywell security systems, orders, or partner opportunities, feel free to ask anytime. Have a wonderful day!");
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "Browse Products", Url = "/products" },
                    new ChatActionDto { Title = "Contact Us", Url = "/contact" }
                };
                return response;
            }

            if (input.Contains("who are you") || input.Contains("what are you") || input.Contains("what can you do") || input.Contains("your name") || input.Contains("help me") || input.Contains("are you a bot") || input.Contains("are you ai"))
            {
                SetText(response, "I am the official **Honeywell Products AI Assistant**.\n\nHere is how I can assist you:\n• **Product Recommendations:** Tell me your requirement (e.g., 'camera for office', 'outdoor solar camera', 'night vision camera') and I will find matching models with prices.\n• **Pricing & Bulk Orders:** Get instant price ranges or request custom commercial quotations.\n• **Post-Purchase Support:** Check order tracking, return policies, 1-year manufacturer warranty claims, and invoice downloads.\n• **Business Partnerships:** Learn about becoming an authorized Honeywell distributor or dealer.");
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "Explore Products", Url = "/products" },
                    new ChatActionDto { Title = "Support Center", Url = "/support" }
                };
                return response;
            }

            // ── 3. Company & Brand Information ──
            if (input.Contains("about honeywell") || input.Contains("about company") || input.Contains("who is honeywell") || input.Contains("what is honeywell") || input.Contains("about us") || (input.Contains("company") && !input.Contains("product")) || input.Contains("brand"))
            {
                SetText(response, "Honeywell Products is a global leader in advanced security and surveillance engineering. We design high-performance video surveillance solutions, intelligent AI analytics cameras, Turbo HD systems, solar-powered commercial security, and network video recorders (NVR/DVR).\n\nKey Highlights:\n• Enterprise-grade reliability with 24/7 continuous recording\n• Smart AcuSense AI human/vehicle classification to reduce false alarms\n• ColorVu ultra-low-light full-color night vision\n• Serving residential, commercial, industrial, healthcare, and retail sectors.");
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "About Us", Url = "/about" },
                    new ChatActionDto { Title = "Explore Solutions", Url = "/solutions" }
                };
                return response;
            }

            // ── 4. Contact, Office Address & Working Hours ──
            if (input.Contains("contact") || input.Contains("phone") || input.Contains("mobile") || input.Contains("email") || input.Contains("address") || input.Contains("headquarters") || input.Contains("head office") || input.Contains("location") || input.Contains("where is your office") || input.Contains("timings") || input.Contains("working hours") || input.Contains("customer care"))
            {
                var config = await _context.SupportConfigs.FirstOrDefaultAsync();
                string phone = config?.SupportPhoneNumber ?? "+1 (800) 323-0194";
                string email = config?.SupportEmail ?? "support@honeywell.com";
                string timings = config?.WorkTimings ?? "Mon-Sat: 9:00 AM - 6:00 PM IST";
                string address = "101, Jain Sadguru Capital Park, Hitech City, Madhapur, Hyderabad - 500081, Telangana, India";

                SetText(response, $"You can reach Honeywell Products Support & Sales directly:\n\n• **Phone:** {phone}\n• **Email:** {email}\n• **Business Hours:** {timings}\n• **Headquarters:** {address}\n\nOur specialists are available to assist you with product selection, technical specifications, or order inquiries.");
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "Contact Us", Url = "/contact" },
                    new ChatActionDto { Title = "Support Center", Url = "/support" }
                };
                return response;
            }

            // ── 5. How to Buy / Place an Order / Checkout ──
            if (input.Contains("how to buy") || input.Contains("how to order") || input.Contains("how can i buy") || input.Contains("purchase") || input.Contains("place order") || input.Contains("where to buy") || input.Contains("checkout") || input.Contains("cart") || input.Contains("buy online"))
            {
                SetText(response, "Buying from Honeywell Products is easy and secure:\n\n1. **Browse:** Visit our [Products Catalog](/products) and choose your desired cameras or recorders.\n2. **Select & Add:** Click 'Add to Cart' or 'Enquire Now' on any product page.\n3. **Checkout:** Go to your Cart and proceed to our SSL-secured checkout.\n4. **Payment:** Pay seamlessly via UPI, Credit/Debit Card, or Net Banking.\n5. **Confirmation:** You'll immediately receive an Order ID with live shipment tracking via SMS and email.\n\nFor volume commercial orders, you can also request a bulk quote.");
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "Explore Products", Url = "/products" },
                    new ChatActionDto { Title = "Request Bulk Quote", Url = "/quote" }
                };
                return response;
            }

            // ── 6. Payment Methods & Billing ──
            if (input.Contains("payment") || HasWord(input, "pay") || input.Contains("upi") || input.Contains("credit card") || input.Contains("debit card") || HasWord(input, "cod") || input.Contains("cash on delivery") || input.Contains("net banking") || input.Contains("emi") || input.Contains("bank transfer"))
            {
                SetText(response, "We offer multiple secure payment methods for your convenience:\n\n• **UPI:** Instant payment via Google Pay, PhonePe, Paytm, and BHIM UPI\n• **Credit & Debit Cards:** Visa, MasterCard, RuPay, and American Express\n• **Net Banking:** Supported across all major Indian banks\n• **Commercial Wire / NEFT / RTGS:** Available for enterprise and bulk quote orders\n\nAll online transactions are encrypted with 256-bit SSL security.");
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "Explore Products", Url = "/products" },
                    new ChatActionDto { Title = "Get Bulk Quote", Url = "/quote" }
                };
                return response;
            }

            // ── 7. Shipping, Delivery Timeline & Courier ──
            if (input.Contains("shipping") || input.Contains("delivery") || input.Contains("dispatch") || input.Contains("courier") || input.Contains("delivery time") || input.Contains("how long does delivery") || input.Contains("shipping charge") || input.Contains("free delivery") || input.Contains("pincode"))
            {
                SetText(response, "Honeywell Products Shipping & Delivery Details:\n\n• **Dispatch:** Orders verified before 2:00 PM are dispatched within 24 hours.\n• **Delivery Timeline:** Standard delivery takes **3 to 5 business days** nationwide.\n• **Delivery Coverage:** We deliver across all major cities and serviceable PIN codes in India.\n• **Packaging:** Sensitive optical sensors and DVR/NVR hardware are packed in shock-resistant industrial containers.\n• **Tracking:** Real-time carrier tracking link is shared via SMS and email upon dispatch.");
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "Tracking Policy", Url = "/support/tracking-policy" },
                    new ChatActionDto { Title = "Support Center", Url = "/support" }
                };
                return response;
            }

            // ── 8. Order Tracking ──
            if (input.Contains("track") || input.Contains("tracking") || input.Contains("where is my order") || input.Contains("order status") || input.Contains("shipment") || input.Contains("consignment"))
            {
                SetText(response, "To track your shipment:\n\n1. Visit our **Order Tracking** section or log into your **Customer Account**.\n2. Enter your **Order ID** (e.g., HW-ORD-XXXX) received in your confirmation email/SMS.\n3. View real-time milestones: Order Confirmed → Dispatched → In Transit → Out for Delivery.\n\nIf you need immediate help with an active order, please share your Order ID with our support team.");
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "Tracking Policy", Url = "/support/tracking-policy" },
                    new ChatActionDto { Title = "Support Center", Url = "/support" }
                };
                return response;
            }

            // ── 9. Return, Replacement, Cancellation & Refund ──
            if (input.Contains("return") || input.Contains("refund") || input.Contains("cancel") || input.Contains("cancellation") || input.Contains("money back") || input.Contains("replace") || input.Contains("exchange"))
            {
                SetText(response, "Honeywell Products Return & Refund Policy:\n\n• **7-Day Return Window:** You can request a return within 7 days of receiving your shipment.\n• **Condition:** Items must be uninstalled, in original factory packaging with all accessories, cables, and warranty cards.\n• **Order Cancellation:** Orders can be cancelled before dispatch directly from your Account Dashboard.\n• **Refund Timeline:** Approved refunds are initiated to your original payment method within **5 to 7 working days** after quality inspection.");
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "Return & Refund Policy", Url = "/support/return-refund" },
                    new ChatActionDto { Title = "Support Center", Url = "/support" }
                };
                return response;
            }

            // ── 10. Warranty, Defects, Repair & Technical Support ──
            if (input.Contains("warranty") || input.Contains("guarantee") || input.Contains("defect") || input.Contains("broken") || input.Contains("repair") || input.Contains("claim") || input.Contains("damage") || input.Contains("service center") || input.Contains("not working") || input.Contains("faulty"))
            {
                SetText(response, "Honeywell Products Manufacturer Warranty:\n\n• **Coverage:** All Honeywell surveillance hardware comes with an official **1-Year Manufacturer Warranty** covering technical, firmware, and component defects.\n• **Filing a Claim:** Submit a ticket through our Support Center or email us with your Tax Invoice, product model, serial number, and a photo/video describing the issue.\n• **Resolution:** Our technical engineering team coordinates repair, replacement, or on-site service as covered under warranty terms.");
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "Warranty Claim", Url = "/support/warranty-claim" },
                    new ChatActionDto { Title = "Submit Support Ticket", Url = "/support" }
                };
                return response;
            }

            // ── 11. Invoices & GST Billing ──
            if (input.Contains("invoice") || input.Contains("bill") || input.Contains("receipt") || input.Contains("gst") || input.Contains("tax invoice") || input.Contains("download invoice"))
            {
                SetText(response, "To download your official GST Tax Invoice:\n\n1. Sign in to your **Customer Portal / Account**.\n2. Navigate to **Order History**.\n3. Click **'Download Invoice'** next to your verified order.\n4. A PDF invoice containing full company details, GST breakdown, and hardware serial numbers will download automatically.");
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "Download Invoice", Url = "/support/download-invoice" },
                    new ChatActionDto { Title = "Support Center", Url = "/support" }
                };
                return response;
            }

            // ── 12. Distributorship, Dealership & Channel Partner ──
            if (input.Contains("distributor") || input.Contains("partner") || input.Contains("franchise") || input.Contains("reseller") || input.Contains("dealer") || input.Contains("dealership") || input.Contains("wholesale") || input.Contains("system integrator"))
            {
                SetText(response, "Honeywell Products Partner & Dealership Program:\n\nWe partner with authorized distributors, system integrators, electrical contractors, and security installers across India.\n\n**Partner Benefits:**\n• Tiered wholesale margins and volume rebates\n• Project deal registration and lead protection\n• Direct access to Honeywell engineering support & training\n• Marketing kits, demonstration equipment, and certified partner credentials\n\nSubmit your business credentials through our Partner Portal to get onboarded.");
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "Distributor Program", Url = "/business" },
                    new ChatActionDto { Title = "Partner Benefits", Url = "/business/partner-benefits" }
                };
                return response;
            }

            // ── 13. Offers, Deals, Discounts & Coupons ──
            if (input.Contains("discount") || input.Contains("coupon") || input.Contains("promo") || input.Contains("code") || input.Contains("offer") || input.Contains("sale") || HasWord(input, "deal") || input.Contains("deals") || input.Contains("cheap") || input.Contains("save"))
            {
                var activeCoupon = await _context.Coupons.AsNoTracking().Where(c => c.IsActive && c.EndDate > DateTime.UtcNow).FirstOrDefaultAsync();
                string couponInfo = activeCoupon != null
                    ? $"Current Promo Code: Use **{activeCoupon.Code}** at checkout for up to {activeCoupon.DiscountValue}{(activeCoupon.DiscountType == "Percentage" ? "%" : "₹")} discount!"
                    : "Check out our latest seasonal promotions in the Deals & Offers section.";

                SetText(response, $"Honeywell Products offers competitive commercial pricing and promotional deals.\n\n{couponInfo}\n\n• **Direct Online Savings:** Special bundle pricing on camera + NVR kits.\n• **Bulk Quotations:** Up to 25%+ volume discounts for enterprise contractors, builders, and large projects.");
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "View Offers & Deals", Url = "/offers" },
                    new ChatActionDto { Title = "Request Bulk Quote", Url = "/quote" }
                };
                return response;
            }

            // ── 14. Bulk Quotes & Enterprise Pricing ──
            if (input.Contains("bulk") || input.Contains("quote") || input.Contains("wholesale price") || input.Contains("enterprise") || input.Contains("large quantity") || input.Contains("tender"))
            {
                SetText(response, "Looking for volume pricing or commercial quotations?\n\nOur Commercial Sales team provides tailored volume quotes within 24 hours for:\n• Multi-camera commercial and industrial projects\n• Housing societies, educational campuses, and hospitals\n• Government and enterprise tender specifications\n\nSubmit your bill of quantities (BOQ) or required camera count through our Bulk Quote form.");
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "Request Bulk Quote", Url = "/quote" },
                    new ChatActionDto { Title = "Contact Commercial Sales", Url = "/contact" }
                };
                return response;
            }

            // ── 15. Installation, Setup & Wiring ──
            if (input.Contains("install") || input.Contains("setup") || input.Contains("configure") || input.Contains("mounting") || input.Contains("wiring") || input.Contains("technician") || input.Contains("how to install") || input.Contains("connect"))
            {
                SetText(response, "Honeywell Camera Installation & Setup Guidance:\n\n• **Plug & Play PoE:** Honeywell Network IP cameras support standard Power over Ethernet (PoE 802.3af/at). A single CAT6 Ethernet cable delivers both power and ultra-HD video.\n• **NVR Auto-Detection:** Connecting Honeywell IP cameras to a Honeywell NVR automatically discovers and configures channels.\n• **Mobile Viewing:** Scan the QR code on your NVR or camera using our mobile app for instant live streaming on Android/iOS.\n• **Professional Installation:** For large-scale projects, we can connect you with certified Honeywell system integrators.");
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "Downloads & Guides", Url = "/support" },
                    new ChatActionDto { Title = "Request Installation Help", Url = "/contact" }
                };
                return response;
            }

            // ── 16. Software, Mobile App, Firmware & Downloads ──
            if (input.Contains("software") || input.Contains("app") || input.Contains("mobile app") || input.Contains("firmware") || input.Contains("download") || input.Contains("manual") || input.Contains("datasheet") || input.Contains("driver") || input.Contains("vms"))
            {
                SetText(response, "Honeywell Software & Documentation Resources:\n\n• **VMS Client Software:** Professional video management software for Windows and macOS multi-monitor control centers.\n• **Mobile Client App:** Live view, 2-way audio, and instant push notifications on Android & iOS devices.\n• **Firmware & Tools:** Device search tools, bandwidth calculators, and firmware upgrade packages.\n• **User Guides & Datasheets:** Comprehensive technical specifications and wiring schematics available in our Downloads Center.");
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "Downloads Center", Url = "/support" },
                    new ChatActionDto { Title = "Support Center", Url = "/support" }
                };
                return response;
            }

            // ── 17. Technical Explanations (NVR vs DVR, Dome vs Bullet, ColorVu) ──
            if (input.Contains("nvr vs dvr") || input.Contains("dvr vs nvr") || input.Contains("what is nvr") || input.Contains("what is dvr") || input.Contains("difference between nvr and dvr"))
            {
                SetText(response, "Comparison: **NVR vs DVR**\n\n• **NVR (Network Video Recorder):** Works with **IP Network Cameras** over standard Ethernet cables (CAT6). Video is encoded and processed digitally at the camera level, supporting ultra-high 4K/12MP resolutions, AI motion analytics, and PoE wiring up to 100m+.\n• **DVR (Digital Video Recorder):** Works with **Analog / Turbo HD Cameras** over coaxial BNC cables. Video processing happens inside the DVR unit.\n\n**Verdict:** NVRs are the industry standard for modern, future-proof commercial and residential security.");
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "View NVR Products", Url = "/products" },
                    new ChatActionDto { Title = "Explore Solutions", Url = "/solutions" }
                };
                return response;
            }

            if (input.Contains("dome vs bullet") || input.Contains("bullet vs dome") || input.Contains("dome or bullet") || input.Contains("difference between dome and bullet"))
            {
                SetText(response, "Comparison: **Dome vs Bullet Cameras**\n\n• **Dome Cameras:** Discreet, compact dome design mounted on ceilings. Highly vandal-resistant (IK10 rated) and difficult for intruders to tamper with or redirect. Ideal for **offices, retail stores, hotel lobbies, and indoor rooms**.\n• **Bullet Cameras:** Cylindrical, visible deterrence mounted on walls or poles. Features longer infrared range and weatherproof sunshields (IP67 rated). Ideal for **outdoor perimeters, parking lots, gates, and driveways**.");
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "View Dome Cameras", Url = "/products" },
                    new ChatActionDto { Title = "View Bullet Cameras", Url = "/products" }
                };
                return response;
            }

            if (input.Contains("colorvu") || input.Contains("night vision") || input.Contains("darkfighter") || input.Contains("night view") || input.Contains("color night"))
            {
                SetText(response, "Honeywell **ColorVu & Night Vision Technology**:\n\n• **Full-Color 24/7:** Unlike traditional IR night vision that switches to grainy black & white in the dark, Honeywell ColorVu cameras capture vivid full-color video 24 hours a day.\n• **F1.0 Super Aperture:** Collects 4x more ambient light than conventional lenses.\n• **Warm Soft Supplemental Light:** Ensures balanced illumination in complete zero-lux pitch darkness without blinding reflection.\n\nCrucial for capturing real vehicle colors, clothing shades, and human face details at night.");
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "ColorVu Cameras", Url = "/products" },
                    new ChatActionDto { Title = "Explore Products", Url = "/products" }
                };
                return response;
            }

            // ── 18. Product Catalog & Recommendation Engine ──
            var productKeywords = new[] {
                "product", "products", "camera", "cameras", "cam", "cams", "cctv", "ip", "surveillance",
                "solar", "bullet", "dome", "ptz", "nvr", "dvr", "recorder", "turbo", "colorvu", "darkfighter",
                "acusense", "sensor", "scanner", "network", "indoor", "outdoor", "office", "home",
                "room", "shop", "store", "warehouse", "factory", "farm", "construction", "wireless", "4g",
                "wifi", "2mp", "4mp", "12mp", "16mp", "4k", "hd", "cheap", "budget", "price", "model",
                "which", "recommend", "best", "options", "catalog"
            };

            bool isProductRelated = productKeywords.Any(k => input.Contains(k));

            if (isProductRelated)
            {
                var query = _context.Products
                    .Include(p => p.Category)
                    .Include(p => p.Images)
                    .AsNoTracking()
                    .Where(p => p.IsActive);

                // Specific environmental filters
                bool isHome = input.Contains("home") || input.Contains("house") || input.Contains("residential") || input.Contains("apartment") || input.Contains("villa");
                bool isOffice = input.Contains("office") || input.Contains("indoor") || input.Contains("room") || input.Contains("workplace") || input.Contains("reception");
                bool isOutdoor = input.Contains("outdoor") || input.Contains("perimeter") || input.Contains("gate") || input.Contains("driveway") || input.Contains("street");
                bool isSolar = input.Contains("solar") || input.Contains("energy");
                bool isDome = input.Contains("dome");
                bool isBullet = input.Contains("bullet");
                bool isPtz = input.Contains("ptz") || input.Contains("zoom");
                bool isTurbo = input.Contains("turbo") || input.Contains("analog");
                bool isNetwork = input.Contains("network") || input.Contains("ip cam") || input.Contains("poe");
                bool isNvr = input.Contains("nvr") || input.Contains("recorder") || input.Contains("dvr");
                bool isSingle = input.Contains("only one") || input.Contains("single") || input.Contains("recommend one") || input.Contains("which one") || input.Contains("best camera") || input.Contains("best cam") || input.Contains("top model");
                bool isBudget = input.Contains("cheap") || input.Contains("budget") || input.Contains("affordable") || input.Contains("lowest price") || input.Contains("cost effective");

                if (isSolar)
                {
                    query = query.Where(p => p.ProductName.Contains("Solar") || (p.ShortDescription != null && p.ShortDescription.Contains("Solar")) || (p.Category != null && p.Category.Name.Contains("Solar")));
                }
                else if (isNvr)
                {
                    query = query.Where(p => p.ProductName.Contains("NVR") || p.ProductName.Contains("DVR") || p.ProductName.Contains("Recorder") || (p.Category != null && (p.Category.Name.Contains("Recorder") || p.Category.Name.Contains("NVR"))));
                }
                else if (isDome)
                {
                    query = query.Where(p => p.ProductName.Contains("Dome"));
                }
                else if (isBullet)
                {
                    query = query.Where(p => p.ProductName.Contains("Bullet"));
                }
                else if (isPtz)
                {
                    query = query.Where(p => p.ProductName.Contains("PTZ") || p.ProductName.Contains("PT"));
                }
                else if (isTurbo)
                {
                    query = query.Where(p => p.ProductName.Contains("Turbo") || (p.Category != null && p.Category.Name.Contains("Turbo")));
                }
                else if (isHome)
                {
                    query = query.Where(p => p.ProductName.Contains("Indoor") || p.ProductName.Contains("Pan") || p.ProductName.Contains("Wi-Fi") || p.ProductName.Contains("Dome") || p.ProductName.Contains("Bullet"));
                }
                else if (isOffice)
                {
                    query = query.Where(p => p.ProductName.Contains("Dome") || p.ProductName.Contains("Fixed") || p.ProductName.Contains("Network") || p.ProductName.Contains("IP") || (p.Category != null && p.Category.Name.Contains("Network")));
                }
                else if (isOutdoor)
                {
                    query = query.Where(p => p.ProductName.Contains("Bullet") || p.ProductName.Contains("PTZ") || p.ProductName.Contains("Solar") || p.ProductName.Contains("Darkfighter"));
                }

                if (isBudget)
                {
                    query = query.OrderBy(p => p.SellingPrice ?? p.MRP);
                }
                else
                {
                    query = query.OrderByDescending(p => p.Id);
                }

                var matchedProducts = await query.Take(4).ToListAsync();

                // If specialized query returned 0, fallback to general active products
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

                    if (isSingle)
                    {
                        var top = matchedProducts.First();
                        decimal price = top.SellingPrice ?? top.MRP;
                        SetText(response, $"The top recommended choice based on your requirement is the **{top.ProductName}** ({top.SKU}) priced at ₹{price:N0}.\n\nKey Highlights:\n• High-definition resolution with crisp optical clarity\n• Smart AcuSense AI motion & perimeter detection\n• True Day/Night vision and vandal-resistant housing\n• Seamless plug-and-play PoE connectivity with Honeywell NVRs");
                    }
                    else if (isSolar)
                    {
                        SetText(response, $"Honeywell **Solar-Powered Security Cameras** operate autonomously without external grid power:\n\nRecommended Models ({matchedProducts.Count}):\n" +
                            string.Join("\n", matchedProducts.Select(p => $"• {p.ProductName} ({p.SKU}) — ₹{p.SellingPrice ?? p.MRP:N0}")) +
                            "\n\nFeatures high-efficiency monocrystalline solar panels, internal lithium-ion backup, and 4G LTE wireless connectivity for farms, construction sites, and remote properties.");
                    }
                    else if (isHome)
                    {
                        SetText(response, $"For **Home & Residential Security**, smart Wi-Fi pan/tilt cameras with remote live view and 2-way audio are ideal:\n\nRecommended Models ({matchedProducts.Count}):\n" +
                            string.Join("\n", matchedProducts.Select(p => $"• {p.ProductName} ({p.SKU}) — ₹{p.SellingPrice ?? p.MRP:N0}")) +
                            "\n\nFeatures 360° motion tracking, real-time intrusion push notifications to your smartphone, and crystal-clear night vision.");
                    }
                    else if (isOffice)
                    {
                        SetText(response, $"For an **Office or Indoor Environment**, discreet Dome and Fixed Network cameras are ideal:\n\nRecommended Models ({matchedProducts.Count}):\n" +
                            string.Join("\n", matchedProducts.Select(p => $"• {p.ProductName} ({p.SKU}) — ₹{p.SellingPrice ?? p.MRP:N0}")) +
                            "\n\nOffers wide-angle reception coverage, tamper-resistant ceiling mounts, and intelligent occupancy & motion sensing.");
                    }
                    else if (isOutdoor)
                    {
                        SetText(response, $"For **Outdoor & Perimeter Surveillance**, weatherproof Bullet and PTZ cameras are recommended:\n\nRecommended Models ({matchedProducts.Count}):\n" +
                            string.Join("\n", matchedProducts.Select(p => $"• {p.ProductName} ({p.SKU}) — ₹{p.SellingPrice ?? p.MRP:N0}")) +
                            "\n\nFeatures IP67 weatherproof rating, long-distance night vision, and visible deterrence against unauthorized intruders.");
                    }
                    else
                    {
                        SetText(response, $"Honeywell Security & Surveillance Systems offer Ultra-HD resolution, PoE connectivity, and AI video analytics.\n\nRecommended Models ({matchedProducts.Count}):\n" +
                            string.Join("\n", matchedProducts.Select(p => $"• {p.ProductName} ({p.SKU}) — ₹{p.SellingPrice ?? p.MRP:N0}")));
                    }

                    response.SuggestedActions = new List<ChatActionDto>
                    {
                        new ChatActionDto { Title = "Explore Products", Url = "/products" },
                        new ChatActionDto { Title = "Request Bulk Quote", Url = "/quote" }
                    };
                    return response;
                }
            }

            // ── 19. Keyword Token Search Across Database (Fuzzy Fallback) ──
            var tokens = input.Split(new[] { ' ', ',', '?', '!', '.', ';', ':', '-', '/' }, StringSplitOptions.RemoveEmptyEntries)
                .Where(t => t.Length > 2 && !IsCommonStopWord(t))
                .ToList();

            if (tokens.Count > 0)
            {
                var tokenQuery = _context.Products
                    .Include(p => p.Category)
                    .Include(p => p.Images)
                    .AsNoTracking()
                    .Where(p => p.IsActive);

                // Check if any product matches any token
                var matchingProducts = await tokenQuery
                    .Where(p => tokens.Any(t =>
                        p.ProductName.Contains(t) ||
                        p.SKU.Contains(t) ||
                        (p.Category != null && p.Category.Name.Contains(t)) ||
                        (p.ShortDescription != null && p.ShortDescription.Contains(t))))
                    .Take(4)
                    .ToListAsync();

                if (matchingProducts.Count > 0)
                {
                    response.Products = matchingProducts.Select(p => new ChatProductDto
                    {
                        Id = p.Id,
                        Name = p.ProductName,
                        Model = p.SKU,
                        Price = p.SellingPrice ?? p.MRP,
                        ImageUrl = p.Images.FirstOrDefault()?.ImageUrl ?? "",
                        Category = p.Category?.Name ?? "Security & Surveillance"
                    }).ToList();

                    SetText(response, $"Here are Honeywell products matching your search for **'{inputMsg}'**:\n\n" +
                        string.Join("\n", matchingProducts.Select(p => $"• **{p.ProductName}** ({p.SKU}) — ₹{p.SellingPrice ?? p.MRP:N0}")) +
                        "\n\nYou can click on any product to view full technical specifications, or request custom project pricing.");

                    response.SuggestedActions = new List<ChatActionDto>
                    {
                        new ChatActionDto { Title = "View All Products", Url = "/products" },
                        new ChatActionDto { Title = "Contact Sales", Url = "/contact" }
                    };
                    return response;
                }
            }

            // ── 20. Context-Aware Helpful Fallback (No robotic brush-off) ──
            SetText(response, $"I'm here to help with your inquiry regarding **\"{inputMsg}\"**.\n\nWhile I don't have an automated answer for that exact phrase, I can assist you with:\n• **Product Search:** Ask for CCTV cameras, IP network cameras, dome, bullet, or solar security models\n• **Quotes & Orders:** Guidance on checkout, payment methods, delivery timelines, or bulk quotes\n• **Customer Support:** Order tracking, 1-year warranty claims, returns & refunds, or tax invoices\n• **Business:** Distributor, dealership, and channel partner opportunities\n\nHow would you like to proceed?");

            response.SuggestedActions = new List<ChatActionDto>
            {
                new ChatActionDto { Title = "Explore Products", Url = "/products" },
                new ChatActionDto { Title = "Support Center", Url = "/support" },
                new ChatActionDto { Title = "Contact Sales", Url = "/contact" }
            };
            return response;
        }

        private async Task<string?> CallExternalAiApiAsync(string apiKey, string userPrompt)
        {
            try
            {
                // Check if Google Gemini key
                if (apiKey.StartsWith("AIzaSy", StringComparison.OrdinalIgnoreCase) ||
                    !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("GEMINI_API_KEY")))
                {
                    var geminiUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}";
                    var geminiBody = new
                    {
                        contents = new[]
                        {
                            new
                            {
                                role = "user",
                                parts = new[]
                                {
                                    new { text = $"You are the official Honeywell Products & Security AI Assistant. Help the customer with concise, professional answers regarding Honeywell CCTV cameras, IP cameras, solar security, prices, orders, warranties, and dealership inquiries.\n\nUser Question: {userPrompt}" }
                                }
                            }
                        }
                    };
                    var json = JsonSerializer.Serialize(geminiBody);
                    var req = new HttpRequestMessage(HttpMethod.Post, geminiUrl)
                    {
                        Content = new StringContent(json, Encoding.UTF8, "application/json")
                    };
                    var res = await _httpClient.SendAsync(req);
                    if (res.IsSuccessStatusCode)
                    {
                        var resContent = await res.Content.ReadAsStringAsync();
                        using var doc = JsonDocument.Parse(resContent);
                        var candidates = doc.RootElement.GetProperty("candidates");
                        if (candidates.GetArrayLength() > 0)
                        {
                            return candidates[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();
                        }
                    }
                }
                else
                {
                    // OpenAI Chat Completions API
                    var requestUri = "https://api.openai.com/v1/chat/completions";
                    var requestBody = new
                    {
                        model = "gpt-4o-mini",
                        messages = new[]
                        {
                            new { role = "system", content = "You are the official Honeywell Products & Security AI Assistant. Help customers with queries regarding CCTV cameras, IP cameras, solar security, bulk quotes, orders, warranty, and distributor partnerships. Be professional, concise, and format lists with bullet points." },
                            new { role = "user", content = userPrompt }
                        },
                        max_tokens = 350
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
                }
            }
            catch
            {
                // Return null to allow fallback to internal rule engine
            }
            return null;
        }

        private static void AttachDefaultActions(ChatMessageResponse response, string input)
        {
            if (response.SuggestedActions != null && response.SuggestedActions.Count > 0) return;

            if (input.Contains("support") || input.Contains("warranty") || input.Contains("return") || input.Contains("track"))
            {
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "Support Center", Url = "/support" },
                    new ChatActionDto { Title = "Warranty Claim", Url = "/support/warranty-claim" }
                };
            }
            else
            {
                response.SuggestedActions = new List<ChatActionDto>
                {
                    new ChatActionDto { Title = "Explore Products", Url = "/products" },
                    new ChatActionDto { Title = "Request Bulk Quote", Url = "/quote" }
                };
            }
        }

        private static bool IsExactMatch(string input, string[] patterns)
        {
            return patterns.Any(p => input.Equals(p, StringComparison.OrdinalIgnoreCase) ||
                                     input.StartsWith(p + " ", StringComparison.OrdinalIgnoreCase) ||
                                     input.EndsWith(" " + p, StringComparison.OrdinalIgnoreCase));
        }

        private static bool HasWord(string text, string word)
        {
            if (string.IsNullOrEmpty(text) || string.IsNullOrEmpty(word)) return false;
            int idx = text.IndexOf(word, StringComparison.OrdinalIgnoreCase);
            while (idx >= 0)
            {
                bool startBoundary = idx == 0 || !char.IsLetterOrDigit(text[idx - 1]);
                bool endBoundary = idx + word.Length == text.Length || !char.IsLetterOrDigit(text[idx + word.Length]);
                if (startBoundary && endBoundary) return true;
                idx = text.IndexOf(word, idx + 1, StringComparison.OrdinalIgnoreCase);
            }
            return false;
        }

        private static bool IsCommonStopWord(string word)
        {
            var stopWords = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "the", "and", "for", "with", "that", "this", "from", "have", "what",
                "when", "where", "which", "who", "whom", "will", "would", "can", "could",
                "should", "does", "doing", "did", "are", "you", "your", "yours", "our",
                "give", "tell", "show", "some", "any", "please", "about", "like", "want"
            };
            return stopWords.Contains(word);
        }

        private static void SetText(ChatMessageResponse response, string text)
        {
            response.Reply = text;
            response.Message = text;
        }
    }
}
