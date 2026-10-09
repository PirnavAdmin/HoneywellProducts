namespace Honeywell.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendOtpEmailAsync(string email, string otp);
        Task SendAdminNotificationEmailAsync(string subject, string htmlBody, string? recipientEmail = null);
    }
}