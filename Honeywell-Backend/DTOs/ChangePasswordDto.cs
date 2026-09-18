namespace Honeywell.DTOs
{
    public class ChangePasswordDto
    {
        public string? Email { get; set; }
        public string? OldPassword { get; set; }
        public string? CurrentPassword { get; set; }
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
