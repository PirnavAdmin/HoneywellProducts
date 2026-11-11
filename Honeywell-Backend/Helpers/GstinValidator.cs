using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace Honeywell.Helpers
{
    public static class GstinValidator
    {
        private const string Chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        private static readonly HashSet<string> ValidStateCodes = new HashSet<string>
        {
            "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
            "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
            "21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
            "31", "32", "33", "34", "35", "36", "37", "38", "97", "99"
        };

        private static readonly Regex PanRegex = new Regex(@"^[A-Z]{5}[0-9]{4}[A-Z]$", RegexOptions.Compiled);

        public class GstinValidationResult
        {
            public bool IsValid { get; set; }
            public string? ErrorMessage { get; set; }
            public string NormalizedGstin { get; set; } = string.Empty;
        }

        public static GstinValidationResult Validate(string? gstin, bool isRequired = false)
        {
            if (string.IsNullOrWhiteSpace(gstin))
            {
                if (isRequired)
                {
                    return new GstinValidationResult
                    {
                        IsValid = false,
                        ErrorMessage = "GSTIN is required."
                    };
                }
                return new GstinValidationResult
                {
                    IsValid = true,
                    NormalizedGstin = string.Empty
                };
            }

            string cleanGstin = gstin.Trim().ToUpperInvariant();

            if (cleanGstin.Length != 15)
            {
                return new GstinValidationResult
                {
                    IsValid = false,
                    ErrorMessage = "Enter a valid 15-character GSTIN.",
                    NormalizedGstin = cleanGstin
                };
            }

            // State code validation (chars 0-1)
            string stateCode = cleanGstin.Substring(0, 2);
            if (!ValidStateCodes.Contains(stateCode))
            {
                return new GstinValidationResult
                {
                    IsValid = false,
                    ErrorMessage = $"Enter a valid 15-character GSTIN. Invalid state code '{stateCode}'.",
                    NormalizedGstin = cleanGstin
                };
            }

            // PAN structure validation (chars 2-11)
            string pan = cleanGstin.Substring(2, 10);
            if (!PanRegex.IsMatch(pan))
            {
                return new GstinValidationResult
                {
                    IsValid = false,
                    ErrorMessage = "Enter a valid 15-character GSTIN. Invalid PAN structure.",
                    NormalizedGstin = cleanGstin
                };
            }

            // Entity number validation (char 12)
            char entityChar = cleanGstin[12];
            if (!char.IsLetterOrDigit(entityChar))
            {
                return new GstinValidationResult
                {
                    IsValid = false,
                    ErrorMessage = "Enter a valid 15-character GSTIN.",
                    NormalizedGstin = cleanGstin
                };
            }

            // Character 14 must be 'Z'
            if (cleanGstin[13] != 'Z')
            {
                return new GstinValidationResult
                {
                    IsValid = false,
                    ErrorMessage = "Enter a valid 15-character GSTIN. Character 14 must be Z.",
                    NormalizedGstin = cleanGstin
                };
            }

            // Checksum calculation (Mod-36 algorithm)
            char expectedChecksum = CalculateChecksum(cleanGstin.Substring(0, 14));
            if (cleanGstin[14] != expectedChecksum)
            {
                return new GstinValidationResult
                {
                    IsValid = false,
                    ErrorMessage = "Enter a valid 15-character GSTIN. Checksum verification failed.",
                    NormalizedGstin = cleanGstin
                };
            }

            return new GstinValidationResult
            {
                IsValid = true,
                NormalizedGstin = cleanGstin
            };
        }

        public static char CalculateChecksum(string gstin14)
        {
            if (string.IsNullOrEmpty(gstin14) || gstin14.Length < 14)
                return '0';

            int sum = 0;
            for (int i = 0; i < 14; i++)
            {
                int code = Chars.IndexOf(gstin14[i]);
                if (code < 0) return '0';

                int factor = (i % 2 == 0) ? 1 : 2;
                int product = code * factor;
                int digit = (product / 36) + (product % 36);
                sum += digit;
            }

            int checkCode = (36 - (sum % 36)) % 36;
            return Chars[checkCode];
        }
    }
}
