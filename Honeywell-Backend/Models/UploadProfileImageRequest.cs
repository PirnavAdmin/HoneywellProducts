using Microsoft.AspNetCore.Http;

namespace Honeywell.Models
{
    public class UploadProfileImageRequest
    {
        public string MobileNumber { get; set; } = string.Empty;

        public IFormFile Image { get; set; } = null!;
    }
}
