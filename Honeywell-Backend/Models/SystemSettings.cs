using System;

namespace Honeywell.Models
{
    public class SystemSettings
    {
        public int Id { get; set; }
        public string PlatformName { get; set; } = "Honeywell Industrial & Commercial Portal";
        public decimal GstPercentage { get; set; } = 18.0m;
        public decimal FlatShippingFee { get; set; } = 50.0m;
        public string CurrencySymbol { get; set; } = "\u20b9";
        public string AdvisoryPolicy { get; set; } = "Standard commercial & industrial equipment warranty framework";
        public string SupportPhone { get; set; } = string.Empty;
        public string SupportEmail { get; set; } = string.Empty;
    }
}
