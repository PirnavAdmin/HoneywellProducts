using System;
using System.Collections.Generic;

namespace Honeywell.DTOs.Chat
{
    public class ChatMessageRequest
    {
        public string Message { get; set; } = string.Empty;
        public string? Prompt { get; set; }
        public string? Timestamp { get; set; }
        public string? SessionId { get; set; }
    }

    public class ChatProductDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }
        public string? Category { get; set; }
    }

    public class ChatActionDto
    {
        public string Title { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
    }

    public class ChatMessageResponse
    {
        public string Status { get; set; } = "Success";
        public bool Success { get; set; } = true;
        public string Reply { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? Category { get; set; }
        public List<ChatProductDto>? Products { get; set; }
        public List<ChatActionDto>? SuggestedActions { get; set; }
    }

    public class ChatConfigDto
    {
        public string Greeting { get; set; } = "Hello! How can I help you today?";
        public List<string> Suggestions { get; set; } = new()
        {
            "Find CCTV Cameras",
            "Find IP Cameras",
            "Solar Security Products",
            "Product Enquiry",
            "Get Bulk Quote",
            "Become a Distributor",
            "Contact Sales"
        };
    }
}
