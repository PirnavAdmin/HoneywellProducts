using System;

namespace Honeywell.Models
{
    public class GrowthJourney
    {
        public int Id { get; set; }
        public string Year { get; set; } = string.Empty;
        public double Business { get; set; }
        public double Products { get; set; }
        public double Customers { get; set; }
        public double Sales { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
