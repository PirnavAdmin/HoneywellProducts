using System;

namespace Honeywell.Models
{
    public class SystemConfig
    {
        public int Id { get; set; }
        public string Key { get; set; } = string.Empty; // contact_card, footer_config, description_manager
        public string JsonValue { get; set; } = string.Empty;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
