using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Honeywell.Data;
using Honeywell.Models;
using Honeywell.Helpers;

namespace Honeywell.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AuthorizeModule("staff", "orders", "tickets", "catalog")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotificationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [AuthorizeModule(PermissionAction.View, "staff", "orders", "tickets", "catalog")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Notification>>> GetAll()
        {
            return await _context.Notifications
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
        }

        [AuthorizeModule(PermissionAction.View, "staff", "orders", "tickets", "catalog")]
        [HttpGet("unread-count")]
        public async Task<ActionResult<int>> GetUnreadCount()
        {
            var count = await _context.Notifications
                .CountAsync(n => !n.IsRead);
            return Ok(count);
        }

        [AuthorizeModule(PermissionAction.Edit, "staff", "orders", "tickets", "catalog")]
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null)
            {
                return NotFound(new { Message = "Notification not found." });
            }

            notification.IsRead = true;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [AuthorizeModule(PermissionAction.Edit, "staff", "orders", "tickets", "catalog")]
        [HttpPut("mark-all-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var unreadNotifications = await _context.Notifications
                .Where(n => !n.IsRead)
                .ToListAsync();

            foreach (var n in unreadNotifications)
            {
                n.IsRead = true;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [AuthorizeModule(PermissionAction.Delete, "staff", "orders", "tickets", "catalog")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null)
            {
                return NotFound(new { Message = "Notification not found." });
            }

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [AuthorizeModule(PermissionAction.Delete, "staff", "orders", "tickets", "catalog")]
        [HttpDelete("clear-all")]
        public async Task<IActionResult> ClearAll()
        {
            var allNotifications = await _context.Notifications.ToListAsync();
            _context.Notifications.RemoveRange(allNotifications);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

