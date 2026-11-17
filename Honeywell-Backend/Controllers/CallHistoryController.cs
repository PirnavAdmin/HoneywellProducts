using System;
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
    [AuthorizeModule("call history", "support", "tickets", "customers")]
    public class CallHistoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CallHistoryController(ApplicationDbContext context)
        {
            _context = context;
        }

        private static readonly TimeZoneInfo IstZone = ResolveIstTimeZone();

        private static TimeZoneInfo ResolveIstTimeZone()
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById("India Standard Time"); }
            catch
            {
                try { return TimeZoneInfo.FindSystemTimeZoneById("Asia/Kolkata"); }
                catch
                {
                    return TimeZoneInfo.CreateCustomTimeZone("IST", TimeSpan.FromHours(5.5), "India Standard Time", "India Standard Time");
                }
            }
        }

        private static DateTime ToIst(DateTime utcDateTime)
        {
            var utc = utcDateTime.Kind == DateTimeKind.Unspecified 
                ? DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc) 
                : utcDateTime.ToUniversalTime();
            return TimeZoneInfo.ConvertTimeFromUtc(utc, IstZone);
        }

        private static string? FormatToIst(DateTime? utcDateTime)
        {
            if (!utcDateTime.HasValue) return null;
            return ToIst(utcDateTime.Value).ToString("dd MMM yyyy, hh:mm tt");
        }

        // GET: api/CallHistory
        [AuthorizeModule(PermissionAction.View, "call history", "support", "tickets", "customers")]
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? search,
            [FromQuery] string? status,
            [FromQuery] string? priority)
        {
            var nowIst = ToIst(DateTime.UtcNow);
            var todayIstDate = nowIst.Date;
            var todayIstStartUtc = TimeZoneInfo.ConvertTimeToUtc(todayIstDate, IstZone);
            var todayIstEndUtc = todayIstStartUtc.AddDays(1);

            // Fast aggregate counts executed directly in MySQL
            int totalCalls = await _context.CallLogs.CountAsync();
            int todayFollowUps = await _context.CallLogs.CountAsync(c => 
                c.Status.ToLower().Contains("follow") && 
                c.CallbackTime.HasValue && 
                c.CallbackTime.Value >= todayIstStartUtc && 
                c.CallbackTime.Value < todayIstEndUtc
            );
            int totalFollowUps = await _context.CallLogs.CountAsync(c => c.Status.ToLower().Contains("follow"));
            int qualifiedLeads = await _context.CallLogs.CountAsync(c => c.IsQualifiedLead);

            var query = _context.CallLogs.AsNoTracking().AsQueryable();

            // Apply search keywords (Customer Name, Rep, Phone, Email, Notes)
            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(c => 
                    c.CustomerName.ToLower().Contains(s) || 
                    c.CalledByRep.ToLower().Contains(s) || 
                    c.CustomerPhone.Contains(s) || 
                    c.CustomerEmail.ToLower().Contains(s) || 
                    c.NotesSummary.ToLower().Contains(s)
                );
            }

            // Apply status filters resiliently across variants
            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All Statuses", StringComparison.OrdinalIgnoreCase))
            {
                var st = status.Trim().ToLowerInvariant();
                if (st.Contains("follow"))
                {
                    query = query.Where(c => c.Status.ToLower().Contains("follow"));
                }
                else if (st.Contains("complete"))
                {
                    query = query.Where(c => c.Status.ToLower().Contains("complete"));
                }
                else if (st.Contains("busy"))
                {
                    query = query.Where(c => c.Status.ToLower().Contains("busy"));
                }
                else if (st.Contains("answer"))
                {
                    query = query.Where(c => c.Status.ToLower().Contains("answer"));
                }
                else
                {
                    query = query.Where(c => c.Status.ToLower() == st);
                }
            }

            // Apply priority filters resiliently
            if (!string.IsNullOrWhiteSpace(priority) && !priority.Equals("All Priorities", StringComparison.OrdinalIgnoreCase))
            {
                var pr = priority.Trim().ToLowerInvariant();
                query = query.Where(c => c.Priority != null && c.Priority.ToLower() == pr);
            }

            var logs = await query.OrderByDescending(c => c.LastCallTime).ToListAsync();

            var formattedLogs = logs.Select(c => new
            {
                c.Id,
                id = c.Id,
                CustomerName = c.CustomerName,
                CalledByRep = c.CalledByRep,
                CustomerPhone = c.CustomerPhone,
                CustomerEmail = c.CustomerEmail,
                Status = c.Status,
                Priority = (c.Priority ?? "LOW").ToUpper(),
                NotesSummary = c.NotesSummary,
                LastCall = FormatToIst(c.LastCallTime),
                LastCallIso = c.LastCallTime.ToString("o"),
                Callback = FormatToIst(c.CallbackTime),
                CallbackIso = c.CallbackTime?.ToString("o"),
                IsTodayFollowUp = c.Status.ToLower().Contains("follow") && c.CallbackTime.HasValue && c.CallbackTime.Value >= todayIstStartUtc && c.CallbackTime.Value < todayIstEndUtc,
                IsQualifiedLead = c.IsQualifiedLead
            }).ToList();

            return Ok(new
            {
                TotalCalls = totalCalls,
                TodayFollowUps = todayFollowUps,
                TotalFollowUps = totalFollowUps,
                QualifiedLeads = qualifiedLeads,
                Calls = formattedLogs
            });
        }

        // POST: api/CallHistory
        [AuthorizeModule(PermissionAction.Add, "call history", "support", "tickets", "customers")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CallLogCreateRequest request)
        {
            if (string.IsNullOrEmpty(request.CustomerName) || string.IsNullOrEmpty(request.CustomerPhone))
            {
                return BadRequest(new { Message = "Customer Name and Customer Phone are required." });
            }

            var cleanStatus = request.Status ?? "Completed";
            if (cleanStatus.Equals("Follow-up Needed", StringComparison.OrdinalIgnoreCase))
            {
                cleanStatus = "Follow-Up";
            }

            var log = new CallLog
            {
                CustomerName = request.CustomerName,
                CustomerPhone = request.CustomerPhone,
                CustomerEmail = request.CustomerEmail ?? "",
                CalledByRep = request.CalledByRep ?? "System Rep",
                Status = cleanStatus,
                Priority = request.Priority ?? "Low",
                NotesSummary = request.NotesSummary ?? "",
                LastCallTime = request.LastCallTime ?? DateTime.UtcNow,
                CallbackTime = request.CallbackTime,
                IsQualifiedLead = request.IsQualifiedLead
            };

            _context.CallLogs.Add(log);
            await _context.SaveChangesAsync();

            var nowIst = ToIst(DateTime.UtcNow);
            var todayIstDate = nowIst.Date;
            var todayIstStartUtc = TimeZoneInfo.ConvertTimeToUtc(todayIstDate, IstZone);
            var todayIstEndUtc = todayIstStartUtc.AddDays(1);

            return Ok(new
            {
                Message = "Call log created successfully.",
                Id = log.Id,
                id = log.Id,
                CustomerName = log.CustomerName,
                Status = log.Status,
                Log = new
                {
                    log.Id,
                    id = log.Id,
                    CustomerName = log.CustomerName,
                    CalledByRep = log.CalledByRep,
                    CustomerPhone = log.CustomerPhone,
                    CustomerEmail = log.CustomerEmail,
                    Status = log.Status,
                    Priority = (log.Priority ?? "LOW").ToUpper(),
                    NotesSummary = log.NotesSummary,
                    LastCall = FormatToIst(log.LastCallTime),
                    LastCallIso = log.LastCallTime.ToString("o"),
                    Callback = FormatToIst(log.CallbackTime),
                    CallbackIso = log.CallbackTime?.ToString("o"),
                    IsTodayFollowUp = log.Status.ToLower().Contains("follow") && log.CallbackTime.HasValue && log.CallbackTime.Value >= todayIstStartUtc && log.CallbackTime.Value < todayIstEndUtc,
                    IsQualifiedLead = log.IsQualifiedLead
                }
            });
        }

        // PUT: api/CallHistory/5
        [AuthorizeModule(PermissionAction.Edit, "call history", "support", "tickets", "customers")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CallLogUpdateRequest request)
        {
            var log = await _context.CallLogs.FindAsync(id);
            if (log == null)
            {
                return NotFound(new { Message = "Call log not found." });
            }

            if (!string.IsNullOrEmpty(request.CustomerName)) log.CustomerName = request.CustomerName;
            if (!string.IsNullOrEmpty(request.CustomerPhone)) log.CustomerPhone = request.CustomerPhone;
            if (!string.IsNullOrEmpty(request.CustomerEmail)) log.CustomerEmail = request.CustomerEmail;
            if (!string.IsNullOrEmpty(request.CalledByRep)) log.CalledByRep = request.CalledByRep;
            if (request.LastCallTime.HasValue) log.LastCallTime = request.LastCallTime.Value;
            
            if (!string.IsNullOrEmpty(request.Status))
            {
                var cleanStatus = request.Status;
                if (cleanStatus.Equals("Follow-up Needed", StringComparison.OrdinalIgnoreCase))
                {
                    cleanStatus = "Follow-Up";
                }
                log.Status = cleanStatus;
            }
            
            if (!string.IsNullOrEmpty(request.Priority)) log.Priority = request.Priority;
            if (!string.IsNullOrEmpty(request.NotesSummary)) log.NotesSummary = request.NotesSummary;
            
            if (request.CallbackTimeSpecified) log.CallbackTime = request.CallbackTime;
            if (request.IsQualifiedLead.HasValue) log.IsQualifiedLead = request.IsQualifiedLead.Value;

            await _context.SaveChangesAsync();
            var nowIst = ToIst(DateTime.UtcNow);
            var todayIstDate = nowIst.Date;
            var todayIstStartUtc = TimeZoneInfo.ConvertTimeToUtc(todayIstDate, IstZone);
            var todayIstEndUtc = todayIstStartUtc.AddDays(1);

            return Ok(new
            {
                Message = "Call log updated successfully.",
                Id = log.Id,
                id = log.Id,
                CustomerName = log.CustomerName,
                Status = log.Status,
                Log = new
                {
                    log.Id,
                    id = log.Id,
                    CustomerName = log.CustomerName,
                    CalledByRep = log.CalledByRep,
                    CustomerPhone = log.CustomerPhone,
                    CustomerEmail = log.CustomerEmail,
                    Status = log.Status,
                    Priority = (log.Priority ?? "LOW").ToUpper(),
                    NotesSummary = log.NotesSummary,
                    LastCall = FormatToIst(log.LastCallTime),
                    LastCallIso = log.LastCallTime.ToString("o"),
                    Callback = FormatToIst(log.CallbackTime),
                    CallbackIso = log.CallbackTime?.ToString("o"),
                    IsTodayFollowUp = log.Status.ToLower().Contains("follow") && log.CallbackTime.HasValue && log.CallbackTime.Value >= todayIstStartUtc && log.CallbackTime.Value < todayIstEndUtc,
                    IsQualifiedLead = log.IsQualifiedLead
                }
            });
        }

        // DELETE: api/CallHistory/5
        [AuthorizeModule(PermissionAction.Delete, "call history", "support", "tickets", "customers")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var log = await _context.CallLogs.FindAsync(id);
            if (log == null)
            {
                return Ok(new { success = true, message = "Call log removed or already deleted." });
            }

            _context.CallLogs.Remove(log);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Call log deleted successfully." });
        }

        public class CallLogCreateRequest
        {
            public string CustomerName { get; set; } = string.Empty;
            public string CustomerPhone { get; set; } = string.Empty;
            public string? CustomerEmail { get; set; }
            public string? CalledByRep { get; set; }
            public string? Status { get; set; }
            public string? Priority { get; set; }
            public string? NotesSummary { get; set; }
            public DateTime? LastCallTime { get; set; }
            public DateTime? CallbackTime { get; set; }
            public bool IsQualifiedLead { get; set; }
        }

        public class CallLogUpdateRequest
        {
            public string? CustomerName { get; set; }
            public string? CustomerPhone { get; set; }
            public string? CustomerEmail { get; set; }
            public string? CalledByRep { get; set; }
            public string? Status { get; set; }
            public string? Priority { get; set; }
            public string? NotesSummary { get; set; }
            public DateTime? LastCallTime { get; set; }
            public DateTime? CallbackTime { get; set; }
            public bool CallbackTimeSpecified { get; set; } = false; // Helper flag to specify nulling callback times
            public bool? IsQualifiedLead { get; set; }
        }
    }
}
