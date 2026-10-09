using System.Threading.Tasks;
using Honeywell.DTOs.Chat;

namespace Honeywell.Services.Interfaces
{
    public interface IChatService
    {
        Task<ChatMessageResponse> ProcessMessageAsync(ChatMessageRequest request);
        Task<ChatConfigDto> GetChatConfigAsync();
    }
}
