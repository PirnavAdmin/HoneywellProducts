using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace Honeywell.Helpers
{
    public static class SupplierValidationHelper
    {
        private static readonly Regex ValidNamePattern = new Regex(@"^[a-zA-Z0-9\s&.\-',()/]+$", RegexOptions.Compiled);
        private static readonly Regex ValidPersonPattern = new Regex(@"^[a-zA-Z\u00C0-\u024F\s.'-]+$", RegexOptions.Compiled);
        private static readonly Regex LettersOnlyRegex = new Regex(@"[a-zA-Z]", RegexOptions.Compiled);
        private static readonly Regex DigitsOnlyRegex = new Regex(@"^\d+$", RegexOptions.Compiled);
        private static readonly Regex IndianPhoneRegex = new Regex(@"^[6-9]\d{9}$", RegexOptions.Compiled);
        private static readonly Regex ValidCityPattern = new Regex(@"^[a-zA-Z0-9\u00C0-\u024F\s.'\-,\/()]+$", RegexOptions.Compiled);
        private static readonly Regex ValidAddressPattern = new Regex(@"^[a-zA-Z0-9\u00C0-\u024F\s,.\-#\/()':;]+$", RegexOptions.Compiled);

        /// <summary>
        /// Detects keyboard-mashed or gibberish text strings (e.g., "gchjhghghggjgjjhgkhggghg",
        /// "gjhghkkgygjjgghjghghgfjghggggygjjgjgj", "aytfvuadsgahkhadkjadghgasg", "asdfasdfasdf", etc.)
        /// while preserving legitimate Indian, Western, and International company, city, and personal names.
        /// </summary>
        public static bool IsGibberish(string? str, bool isContactPerson = false)
        {
            if (string.IsNullOrWhiteSpace(str)) return false;
            string clean = str.Trim();

            // 1. Triple or more identical consecutive letters (e.g. ggg, aaaa, zzz)
            if (Regex.IsMatch(clean, @"([a-zA-Z])\1{2,}", RegexOptions.IgnoreCase))
            {
                return true;
            }

            // 2. Repetitive n-grams repeated 3+ times (e.g. ghghgh, asdfasdfasdf, gjgjgj)
            if (Regex.IsMatch(clean, @"([a-zA-Z]{2,4})\1{2,}", RegexOptions.IgnoreCase))
            {
                return true;
            }

            // Split into words by common delimiters
            var words = Regex.Split(clean, @"[\s\-&'.,()/]+");
            foreach (var rawWord in words)
            {
                if (string.IsNullOrWhiteSpace(rawWord)) continue;
                string lettersOnly = Regex.Replace(rawWord, @"[^a-zA-Z\u00C0-\u024F]", "");
                if (lettersOnly.Length == 0) continue;

                // Single unspaced word too long (real human or company name words rarely exceed 22 letters)
                if (lettersOnly.Length > 22)
                {
                    return true;
                }

                // Acronyms (2 to 5 all-uppercase letters like BHEL, HDFC, TCS, 3M) are allowed
                bool isAllUpper = lettersOnly.Length <= 5 && lettersOnly == lettersOnly.ToUpperInvariant();
                if (isAllUpper) continue;

                // Words with length >= 5 must have at least one vowel
                int vowelCount = 0;
                foreach (char c in lettersOnly)
                {
                    char lower = char.ToLowerInvariant(c);
                    if (lower == 'a' || lower == 'e' || lower == 'i' || lower == 'o' || lower == 'u' || lower == 'y' ||
                        (lower >= '\u00C0' && lower <= '\u024F'))
                    {
                        vowelCount++;
                    }
                }

                if (lettersOnly.Length >= 5 && vowelCount == 0)
                {
                    return true;
                }

                // Check for excessive consecutive consonants without a vowel (6+ in a row)
                if (Regex.IsMatch(lettersOnly, @"[bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ]{6,}", RegexOptions.IgnoreCase))
                {
                    return true;
                }

                // Check for low character diversity in words of length >= 8
                if (lettersOnly.Length >= 8)
                {
                    var charCounts = new Dictionary<char, int>();
                    var consonantCounts = new Dictionary<char, int>();

                    foreach (char c in lettersOnly.ToLowerInvariant())
                    {
                        charCounts[c] = charCounts.GetValueOrDefault(c, 0) + 1;
                        if (c != 'a' && c != 'e' && c != 'i' && c != 'o' && c != 'u' && c != 'y' &&
                            !(c >= '\u00C0' && c <= '\u024F'))
                        {
                            consonantCounts[c] = consonantCounts.GetValueOrDefault(c, 0) + 1;
                        }
                    }

                    int maxConsonantFreq = 0;
                    foreach (var val in consonantCounts.Values)
                    {
                        if (val > maxConsonantFreq) maxConsonantFreq = val;
                    }

                    // A single consonant accounts for 40%+ of the word
                    if ((double)maxConsonantFreq / lettersOnly.Length >= 0.40)
                    {
                        return true;
                    }

                    if (charCounts.Count <= 3)
                    {
                        return true;
                    }
                }
            }

            if (isContactPerson)
            {
                string allLetters = Regex.Replace(clean, @"[^a-zA-Z\u00C0-\u024F]", "");
                int totalVowels = 0;
                foreach (char c in allLetters)
                {
                    char lower = char.ToLowerInvariant(c);
                    if (lower == 'a' || lower == 'e' || lower == 'i' || lower == 'o' || lower == 'u' || lower == 'y' ||
                        (lower >= '\u00C0' && lower <= '\u024F'))
                    {
                        totalVowels++;
                    }
                }
                if (allLetters.Length >= 4 && totalVowels == 0)
                {
                    return true;
                }
            }

            return false;
        }

        public static (bool IsValid, Dictionary<string, string[]> Errors, string? NormalizedGstin, string? NormalizedPhone) ValidateSupplier(
            string? name,
            string? contactPerson,
            string? phone,
            string? email,
            string? city,
            string? address,
            string? gstin,
            string? productLines,
            string? leadTime = null)
        {
            var errors = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);

            void AddError(string field, string error)
            {
                if (!errors.ContainsKey(field))
                {
                    errors[field] = new List<string>();
                }
                errors[field].Add(error);
            }

            // 1. Supplier Name validation
            if (string.IsNullOrWhiteSpace(name))
            {
                AddError("Name", "Supplier Name is required.");
            }
            else
            {
                string trimmed = name.Trim();
                if (trimmed.Length < 2)
                {
                    AddError("Name", "Supplier Name must be at least 2 characters.");
                }
                else if (trimmed.Length > 150)
                {
                    AddError("Name", "Supplier Name cannot exceed 150 characters.");
                }
                else if (Regex.IsMatch(trimmed, @"\s{3,}"))
                {
                    AddError("Name", "Supplier Name contains excessive consecutive spaces.");
                }
                else if (DigitsOnlyRegex.IsMatch(trimmed))
                {
                    AddError("Name", "Supplier Name cannot consist of numbers only.");
                }
                else if (!LettersOnlyRegex.IsMatch(trimmed))
                {
                    AddError("Name", "Enter a valid supplier/company name.");
                }
                else if (!ValidNamePattern.IsMatch(trimmed))
                {
                    AddError("Name", "Enter a valid supplier/company name.");
                }
                else
                {
                    int alphaNumCount = 0;
                    foreach (char c in trimmed)
                    {
                        if (char.IsLetterOrDigit(c)) alphaNumCount++;
                    }
                    if (alphaNumCount < 2 || IsGibberish(trimmed, isContactPerson: false))
                    {
                        AddError("Name", "Enter a valid supplier/company name.");
                    }
                }
            }

            // 2. Contact Person validation
            if (string.IsNullOrWhiteSpace(contactPerson))
            {
                AddError("ContactPerson", "Contact Person is required.");
            }
            else
            {
                string trimmed = contactPerson.Trim();
                if (trimmed.Length < 2)
                {
                    AddError("ContactPerson", "Contact Person name must be at least 2 characters.");
                }
                else if (trimmed.Length > 100)
                {
                    AddError("ContactPerson", "Contact Person name cannot exceed 100 characters.");
                }
                else if (Regex.IsMatch(trimmed, @"\s{2,}"))
                {
                    AddError("ContactPerson", "Contact Person name contains excessive consecutive spaces.");
                }
                else if (Regex.IsMatch(trimmed, @"\d"))
                {
                    AddError("ContactPerson", "Contact Person name cannot contain numbers.");
                }
                else if (!ValidPersonPattern.IsMatch(trimmed))
                {
                    AddError("ContactPerson", "Enter a valid contact person's name.");
                }
                else
                {
                    int letterCount = 0;
                    foreach (char c in trimmed)
                    {
                        if (char.IsLetter(c)) letterCount++;
                    }
                    if (letterCount < 2 || IsGibberish(trimmed, isContactPerson: true))
                    {
                        AddError("ContactPerson", "Enter a valid contact person's name.");
                    }
                }
            }

            // 3. GSTIN validation (optional, but strictly validated when populated)
            string? normalizedGstin = null;
            if (!string.IsNullOrWhiteSpace(gstin))
            {
                var gstinResult = GstinValidator.Validate(gstin, isRequired: false);
                if (!gstinResult.IsValid)
                {
                    AddError("Gstin", gstinResult.ErrorMessage ?? "Enter a valid 15-character GSTIN.");
                }
                else
                {
                    normalizedGstin = gstinResult.NormalizedGstin;
                }
            }

            // 4. Product Lines
            if (string.IsNullOrWhiteSpace(productLines))
            {
                AddError("ProductLines", "Product Lines is required.");
            }
            else if (productLines.Trim().Length < 2)
            {
                AddError("ProductLines", "Product Lines must be at least 2 characters.");
            }
            else if (productLines.Trim().Length > 255)
            {
                AddError("ProductLines", "Product Lines cannot exceed 255 characters.");
            }

            // 5. Phone validation
            string? normalizedPhone = null;
            if (string.IsNullOrWhiteSpace(phone))
            {
                AddError("Phone", "Enter a valid phone number.");
            }
            else
            {
                string cleanPhone = phone.Trim();
                if (Regex.IsMatch(cleanPhone, @"[a-zA-Z]"))
                {
                    AddError("Phone", "Enter a valid phone number.");
                }
                else if (!Regex.IsMatch(cleanPhone, @"^[\d\s+\-()]+$"))
                {
                    AddError("Phone", "Enter a valid phone number.");
                }
                else
                {
                    int plusCount = 0;
                    foreach (char c in cleanPhone) if (c == '+') plusCount++;
                    if (plusCount > 1 || (plusCount == 1 && !cleanPhone.StartsWith("+")))
                    {
                        AddError("Phone", "Enter a valid phone number.");
                    }
                    else
                    {
                        string rawDigits = Regex.Replace(cleanPhone, @"\D", "");
                        if (rawDigits.Length == 0 || Regex.IsMatch(rawDigits, @"^(\d)\1+$"))
                        {
                            AddError("Phone", "Enter a valid phone number.");
                        }
                        else if (cleanPhone.StartsWith("+91") || (cleanPhone.StartsWith("91") && rawDigits.Length == 12))
                        {
                            string mobile = rawDigits.StartsWith("91") ? rawDigits.Substring(2) : rawDigits;
                            if (mobile.Length != 10 || !IndianPhoneRegex.IsMatch(mobile))
                            {
                                AddError("Phone", "Enter a valid phone number.");
                            }
                            else
                            {
                                normalizedPhone = "+91" + mobile;
                            }
                        }
                        else if (!cleanPhone.StartsWith("+"))
                        {
                            if (rawDigits.Length != 10 || !IndianPhoneRegex.IsMatch(rawDigits))
                            {
                                AddError("Phone", "Enter a valid phone number.");
                            }
                            else
                            {
                                normalizedPhone = rawDigits;
                            }
                        }
                        else if (cleanPhone.StartsWith("+"))
                        {
                            if (rawDigits.Length < 7 || rawDigits.Length > 15 || rawDigits.StartsWith("0"))
                            {
                                AddError("Phone", "Enter a valid phone number.");
                            }
                            else
                            {
                                normalizedPhone = "+" + rawDigits;
                            }
                        }
                        else
                        {
                            AddError("Phone", "Enter a valid phone number.");
                        }
                    }
                }
            }

            // 6. Email validation (RFC 5321 / RFC 5322 strict)
            if (string.IsNullOrWhiteSpace(email))
            {
                AddError("Email", "Enter a valid email address.");
            }
            else
            {
                string trimmedEmail = email.Trim();
                if (trimmedEmail.Length > 254 || Regex.IsMatch(trimmedEmail, @"\s"))
                {
                    AddError("Email", "Enter a valid email address.");
                }
                else
                {
                    var atParts = trimmedEmail.Split('@');
                    if (atParts.Length != 2 || string.IsNullOrEmpty(atParts[0]) || string.IsNullOrEmpty(atParts[1]) || atParts[0].Length > 64)
                    {
                        AddError("Email", "Enter a valid email address.");
                    }
                    else
                    {
                        string local = atParts[0];
                        string domain = atParts[1];

                        if (!Regex.IsMatch(local, @"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$") ||
                            local.StartsWith(".") || local.EndsWith(".") || local.Contains(".."))
                        {
                            AddError("Email", "Enter a valid email address.");
                        }
                        else if (!domain.Contains("."))
                        {
                            AddError("Email", "Enter a valid email address.");
                        }
                        else
                        {
                            var domainLabels = domain.Split('.');
                            bool labelsValid = true;
                            foreach (var label in domainLabels)
                            {
                                if (label.Length == 0 || label.Length > 63 || !Regex.IsMatch(label, @"^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$"))
                                {
                                    labelsValid = false;
                                    break;
                                }
                            }

                            if (!labelsValid)
                            {
                                AddError("Email", "Enter a valid email address.");
                            }
                            else
                            {
                                string tld = domainLabels[domainLabels.Length - 1];
                                // TLD length 2-10, all letters, no repeated characters (rejects commmmmmm, cooom)
                                if (!Regex.IsMatch(tld, @"^[a-zA-Z]{2,10}$") || Regex.IsMatch(tld, @"([a-zA-Z])\1{1,}", RegexOptions.IgnoreCase))
                                {
                                    AddError("Email", "Enter a valid email address.");
                                }
                                else
                                {
                                    string domainLower = domain.ToLowerInvariant();
                                    if (domainLower.StartsWith("gmail.") && domainLower != "gmail.com")
                                    {
                                        AddError("Email", "Enter a valid email address.");
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 7. City / Region validation
            if (string.IsNullOrWhiteSpace(city))
            {
                AddError("City", "Enter a valid city or region.");
            }
            else
            {
                string trimmedCity = city.Trim();
                if (trimmedCity.Length < 2 || trimmedCity.Length > 100)
                {
                    AddError("City", "Enter a valid city or region.");
                }
                else if (Regex.IsMatch(trimmedCity, @"\s{2,}"))
                {
                    AddError("City", "Enter a valid city or region.");
                }
                else if (DigitsOnlyRegex.IsMatch(trimmedCity))
                {
                    AddError("City", "Enter a valid city or region.");
                }
                else if (!ValidCityPattern.IsMatch(trimmedCity))
                {
                    AddError("City", "Enter a valid city or region.");
                }
                else
                {
                    int letterCount = 0;
                    foreach (char c in trimmedCity)
                    {
                        if (char.IsLetter(c)) letterCount++;
                    }
                    if (letterCount < 2 || IsGibberish(trimmedCity, isContactPerson: false))
                    {
                        AddError("City", "Enter a valid city or region.");
                    }
                }
            }

            // 8. Registered Address validation
            if (string.IsNullOrWhiteSpace(address))
            {
                AddError("Address", "Enter a valid registered address.");
            }
            else
            {
                string trimmedAddress = address.Trim();
                if (trimmedAddress.Length < 5 || trimmedAddress.Length > 500)
                {
                    AddError("Address", "Enter a valid registered address.");
                }
                else if (!ValidAddressPattern.IsMatch(trimmedAddress))
                {
                    AddError("Address", "Enter a valid registered address.");
                }
                else if (!Regex.IsMatch(trimmedAddress, @"[\s,.\-#\/()':;]") && trimmedAddress.Length > 20)
                {
                    // Single unbroken word of 20+ chars with no spaces or punctuation (e.g. aytfvuadsgahkhadkjadghgasg)
                    AddError("Address", "Enter a valid registered address.");
                }
                else
                {
                    int alphaNumCount = 0;
                    foreach (char c in trimmedAddress)
                    {
                        if (char.IsLetterOrDigit(c)) alphaNumCount++;
                    }
                    if (alphaNumCount < 3 || IsGibberish(trimmedAddress, isContactPerson: false))
                    {
                        AddError("Address", "Enter a valid registered address.");
                    }
                }
            }

            // 9. Average Lead Time validation (optional, whole days 1 - 365)
            if (!string.IsNullOrWhiteSpace(leadTime))
            {
                string trimmedLeadTime = leadTime.Trim();
                if (!Regex.IsMatch(trimmedLeadTime, @"^\d+$"))
                {
                    AddError("LeadTime", "Enter a valid lead time in days.");
                }
                else if (!int.TryParse(trimmedLeadTime, out int days) || days <= 0 || days > 365)
                {
                    AddError("LeadTime", "Enter a valid lead time in days.");
                }
            }

            var resultErrors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);
            foreach (var kvp in errors)
            {
                resultErrors[kvp.Key] = kvp.Value.ToArray();
            }

            return (resultErrors.Count == 0, resultErrors, normalizedGstin, normalizedPhone);
        }
    }
}
