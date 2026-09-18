using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Honeywell.DTOs
{
    public class FlexibleStringConverter : JsonConverter<string>
    {
        public override string Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Number)
            {
                if (reader.TryGetInt64(out long l)) return l.ToString();
                if (reader.TryGetDouble(out double d)) return d.ToString();
            }
            if (reader.TokenType == JsonTokenType.String)
            {
                return reader.GetString() ?? string.Empty;
            }
            using var doc = JsonDocument.ParseValue(ref reader);
            return doc.RootElement.GetRawText();
        }

        public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value);
        }
    }

    public class ReviewDto
    {
        public string Id { get; set; } = string.Empty;
        public string ProductId { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public decimal Rating { get; set; } = 5.0m;
        public string ReviewComment { get; set; } = string.Empty;
        public DateTime ReviewDate { get; set; } = DateTime.UtcNow;
        public bool VerifiedPurchase { get; set; } = true;
        public string Status { get; set; } = "Approved";
    }

    public class CreateReviewDto
    {
        [Required]
        [JsonConverter(typeof(FlexibleStringConverter))]
        public string ProductId { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string CustomerName { get; set; } = string.Empty;

        [Range(1.0, 5.0)]
        public decimal Rating { get; set; } = 5.0m;

        [Required]
        public string ReviewComment { get; set; } = string.Empty;

        public DateTime? ReviewDate { get; set; } = DateTime.UtcNow;
        public bool VerifiedPurchase { get; set; } = true;
        public string Status { get; set; } = "Approved";
    }
}
