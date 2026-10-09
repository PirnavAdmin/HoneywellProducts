using System.Threading.Tasks;
using Honeywell.DTOs.Chat;
using Honeywell.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Honeywell.Controllers
{
    [ApiController]
    [Route("api/chat")]
    [Route("api/Chatbot")]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;

        public ChatController(IChatService chatService)
        {
            _chatService = chatService;
        }

        // POST: api/chat or api/chat/message or api/Chatbot/query
        [HttpPost]
        [HttpPost("message")]
        [HttpPost("query")]
        [HttpPost("/api/Support/bot/chat")]
        public async Task<IActionResult> ProcessMessage([FromBody] ChatMessageRequest request)
        {
            if (request == null || (string.IsNullOrWhiteSpace(request.Message) && string.IsNullOrWhiteSpace(request.Prompt)))
            {
                return BadRequest(new { status = "Failed", message = "Message content is required." });
            }

            var response = await _chatService.ProcessMessageAsync(request);
            return Ok(response);
        }

        // GET: api/chat/suggestions or api/Chatbot/config
        [HttpGet("suggestions")]
        [HttpGet("config")]
        [HttpGet("/api/Support/bot/config")]
        public async Task<IActionResult> GetConfig()
        {
            var config = await _chatService.GetChatConfigAsync();
            return Ok(config);
        }
    }
}
