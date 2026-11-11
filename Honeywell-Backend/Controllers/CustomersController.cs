
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
    [AuthorizeModule("customers", "staff")]
    public class CustomersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CustomersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ============================================
        // DUPLICATE EMAIL VALIDATION
        // ============================================
        private async Task<bool> IsEmailAlreadyUsedAsync(
            string? email,
            int? excludeCustomerId = null)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            var cleanEmail = email.Trim().ToLower();

            // Check Customers
            var customerExists = await _context.Customers.AnyAsync(c =>
                c.Email != null &&
                c.Email.Trim().ToLower() == cleanEmail &&
                (!excludeCustomerId.HasValue ||
                 c.Id != excludeCustomerId.Value));

            if (customerExists)
                return true;

            // Check Admin / SuperAdmin users
            var adminExists = await _context.Users.AnyAsync(u =>
                u.Email != null &&
                u.Email.Trim().ToLower() == cleanEmail);

            if (adminExists)
                return true;

            // Check Staff
            var staffExists = await _context.Staff.AnyAsync(s =>
                s.Email != null &&
                s.Email.Trim().ToLower() == cleanEmail);

            return staffExists;
        }

        // ============================================
        // DUPLICATE MOBILE VALIDATION
        // ============================================
        private async Task<bool> IsMobileAlreadyUsedAsync(
            string? mobile,
            int? excludeCustomerId = null,
            int? excludeGrowerUserId = null)
        {
            if (string.IsNullOrWhiteSpace(mobile))
                return false;

            var cleanMobile = mobile.Trim();

            // Check Customers
            var customerExists = await _context.Customers.AnyAsync(c =>
                c.Phone != null &&
                c.Phone.Trim() == cleanMobile &&
                (!excludeCustomerId.HasValue ||
                 c.Id != excludeCustomerId.Value));

            if (customerExists)
                return true;

            // Check Admin / SuperAdmin users
            var adminExists = await _context.Users.AnyAsync(u =>
                u.MobileNumber != null &&
                u.MobileNumber.Trim() == cleanMobile);

            if (adminExists)
                return true;

            // Check Staff
            var staffExists = await _context.Staff.AnyAsync(s =>
                (s.Phone != null &&
                 s.Phone.Trim() == cleanMobile) ||
                (s.MobileNumber != null &&
                 s.MobileNumber.Trim() == cleanMobile));

            if (staffExists)
                return true;

            // Check GrowerUsers, excluding this customer's
            // own linked GrowerUser during an update.
            var growerExists = await _context.GrowerUsers.AnyAsync(g =>
                g.Phone != null &&
                g.Phone.Trim() == cleanMobile &&
                (!excludeGrowerUserId.HasValue ||
                 g.Id != excludeGrowerUserId.Value));

            return growerExists;
        }

        // GET: api/Customers?search=&status=
        [AuthorizeModule(PermissionAction.View, "customers", "staff")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Customer>>> GetAll(
            [FromQuery] string? search,
            [FromQuery] string? status)
        {
            var query = _context.Customers
                .Include(c => c.AgrarianProfile)
                .Include(c => c.Advisories)
                .Include(c => c.Orders)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(c =>
                    c.Name.Contains(search) ||
                    c.Phone.Contains(search) ||
                    c.Email.Contains(search));
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(c => c.Status == status);
            }

            var customers = await query.ToListAsync();

            foreach (var c in customers)
            {
                if (string.IsNullOrWhiteSpace(c.Role) ||
                    c.Role.Equals("Grower", StringComparison.OrdinalIgnoreCase) ||
                    c.Role.Equals("Farmer", StringComparison.OrdinalIgnoreCase))
                {
                    c.Role = "Customer Account";
                }
            }

            return Ok(customers);
        }

        // GET: api/Customers/5
        [AuthorizeModule(PermissionAction.View, "customers", "staff")]
        [HttpGet("{id}")]
        public async Task<ActionResult<Customer>> GetById(int id)
        {
            var customer = await _context.Customers
                .Include(c => c.AgrarianProfile)
                .Include(c => c.Advisories)
                    .ThenInclude(a => a.Staff)
                .Include(c => c.Orders)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null)
            {
                return NotFound(new
                {
                    Message = "Customer not found."
                });
            }

            if (string.IsNullOrWhiteSpace(customer.Role) ||
                customer.Role.Equals("Grower", StringComparison.OrdinalIgnoreCase) ||
                customer.Role.Equals("Farmer", StringComparison.OrdinalIgnoreCase))
            {
                customer.Role = "Customer Account";
            }

            return Ok(customer);
        }

        // ============================================
        // POST: api/Customers
        // CREATE CUSTOMER
        // ============================================
        [AuthorizeModule(PermissionAction.Add, "customers", "staff")]
        [HttpPost]
        public async Task<ActionResult<Customer>> Create(
            [FromBody] Customer customer)
        {
            if (customer == null)
            {
                return BadRequest(new
                {
                    Message = "Invalid customer details."
                });
            }

            if (string.IsNullOrWhiteSpace(customer.Name) ||
                string.IsNullOrWhiteSpace(customer.Phone))
            {
                return BadRequest(new
                {
                    Message = "Name and Phone number are required."
                });
            }

            // Normalize values
            customer.Name = customer.Name.Trim();
            customer.Phone = customer.Phone.Trim();

            if (!string.IsNullOrWhiteSpace(customer.Email))
            {
                customer.Email = customer.Email.Trim();
            }

            // Check duplicate email
            if (await IsEmailAlreadyUsedAsync(customer.Email))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "This email address is already registered."
                });
            }

            // Check duplicate mobile
            if (await IsMobileAlreadyUsedAsync(customer.Phone))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "This mobile number is already registered."
                });
            }

            // Ensure proper customer role / type
            if (string.IsNullOrWhiteSpace(customer.Role) ||
                customer.Role.Equals("Grower", StringComparison.OrdinalIgnoreCase) ||
                customer.Role.Equals("Farmer", StringComparison.OrdinalIgnoreCase))
            {
                customer.Role = "Customer Account";
            }

            // Create a new GrowerUser after duplicate validation
            var user = new GrowerUser
            {
                Phone = customer.Phone,
                Role = customer.Role,
                IsActive = true
            };

            _context.GrowerUsers.Add(user);

            await _context.SaveChangesAsync();

            customer.UserId = user.Id;
            customer.JoinDate = DateTime.UtcNow;

            if (customer.AgrarianProfile != null)
            {
                customer.AgrarianProfile.Customer = customer;
            }

            _context.Customers.Add(customer);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetById),
                new { id = customer.Id },
                customer);
        }

        // ============================================
        // PUT: api/Customers/5
        // UPDATE CUSTOMER
        // ============================================
        [AuthorizeModule(PermissionAction.Edit, "customers", "staff")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] Customer updateData)
        {
            if (updateData == null)
            {
                return BadRequest(new
                {
                    Message = "Invalid customer details."
                });
            }

            var customer = await _context.Customers
                .Include(c => c.AgrarianProfile)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null)
            {
                return NotFound(new
                {
                    Message = "Customer not found."
                });
            }

            // Normalize incoming values
            var newEmail = updateData.Email?.Trim();
            var newPhone = updateData.Phone?.Trim();

            // Get the current customer's linked GrowerUser
            var linkedUserId = customer.UserId;

            // Check duplicate email, excluding current customer
            if (await IsEmailAlreadyUsedAsync(newEmail, id))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "This email address is already registered."
                });
            }

            // Check duplicate mobile, excluding current customer
            // and its own linked GrowerUser
            if (await IsMobileAlreadyUsedAsync(
                newPhone,
                id,
                linkedUserId))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "This mobile number is already registered."
                });
            }

            // Update customer details
            customer.Name = updateData.Name?.Trim();
            customer.Phone = newPhone;
            customer.Email = newEmail;
            customer.Status = updateData.Status;
            customer.CoinsBalance = updateData.CoinsBalance;
            customer.Address = updateData.Address;
            customer.District = updateData.District;
            customer.State = updateData.State;

            if (!string.IsNullOrWhiteSpace(updateData.Role))
            {
                customer.Role = updateData.Role;
            }

            if (!string.IsNullOrWhiteSpace(updateData.CompanyOrganization))
            {
                customer.CompanyOrganization =
                    updateData.CompanyOrganization;
            }

            if (!string.IsNullOrEmpty(updateData.ProfilePicture))
            {
                customer.ProfilePicture = updateData.ProfilePicture;
            }

            // Synchronize linked GrowerUser
            if (customer.UserId.HasValue)
            {
                var linkedUser = await _context.GrowerUsers
                    .FindAsync(customer.UserId.Value);

                if (linkedUser != null)
                {
                    linkedUser.Phone = newPhone ?? linkedUser.Phone;

                    if (!string.IsNullOrWhiteSpace(customer.Role))
                    {
                        linkedUser.Role = customer.Role;
                    }
                }
            }

            // Update Agrarian Profile
            if (updateData.AgrarianProfile != null)
            {
                if (customer.AgrarianProfile == null)
                {
                    customer.AgrarianProfile = new CustomerAgrarian
                    {
                        CustomerId = id
                    };
                }

                customer.AgrarianProfile.SoilType =
                    updateData.AgrarianProfile.SoilType;

                customer.AgrarianProfile.CropType =
                    updateData.AgrarianProfile.CropType;

                customer.AgrarianProfile.FarmSizeAcres =
                    updateData.AgrarianProfile.FarmSizeAcres;

                customer.AgrarianProfile.IrrigationSource =
                    updateData.AgrarianProfile.IrrigationSource;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Customers/5
        [AuthorizeModule(PermissionAction.Delete, "customers", "staff")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var customer = await _context.Customers.FindAsync(id);

            if (customer == null)
            {
                return NotFound(new
                {
                    Message = "Customer not found."
                });
            }

            _context.Customers.Remove(customer);

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Customers/5/advisory
        [AuthorizeModule(PermissionAction.Add, "customers", "staff")]
        [HttpPost("{id}/advisory")]
        public async Task<ActionResult<CustomerAdvisory>> AddAdvisory(
            int id,
            [FromBody] AdvisoryLogRequest request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    Message = "Invalid advisory details."
                });
            }

            var customer = await _context.Customers.FindAsync(id);

            if (customer == null)
            {
                return NotFound(new
                {
                    Message = "Customer not found."
                });
            }

            var staffExists = await _context.Staff
                .AnyAsync(s => s.Id == request.StaffId);

            if (!staffExists)
            {
                return BadRequest(new
                {
                    Message = "Invalid Staff ID."
                });
            }

            var advisory = new CustomerAdvisory
            {
                CustomerId = id,
                AdvisoryText = request.AdvisoryText,
                Recommendation = request.Recommendation,
                StaffId = request.StaffId,
                DateCreated = DateTime.UtcNow
            };

            _context.CustomerAdvisories.Add(advisory);

            await _context.SaveChangesAsync();

            // Load staff navigation for response
            await _context.Entry(advisory)
                .Reference(a => a.Staff)
                .LoadAsync();

            return Ok(advisory);
        }
    }
}
