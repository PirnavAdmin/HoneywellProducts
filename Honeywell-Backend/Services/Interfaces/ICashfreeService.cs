using System.Threading.Tasks;
using Honeywell.DTOs;
using Honeywell.Models;

namespace Honeywell.Services.Interfaces
{
    public interface ICashfreeService
    {
        /// <summary>
        /// Checks whether the Cashfree App ID and Secret Key credentials are configured in environment variables or configuration.
        /// </summary>
        bool IsConfigured();

        /// <summary>
        /// Returns current configured environment (sandbox/production).
        /// </summary>
        string GetEnvironment();

        /// <summary>
        /// Returns current configured API version (e.g. 2026-01-01).
        /// </summary>
        string GetApiVersion();

        /// <summary>
        /// Creates a payment order in Cashfree Sandbox for a valid application order and records the transaction.
        /// </summary>
        Task<CashfreeOrderCreationResponse> CreatePaymentOrderAsync(
            Order order,
            string? returnUrl = null,
            string? notifyUrl = null,
            string? idempotencyKey = null);

        /// <summary>
        /// Fetches existing order status and details directly from Cashfree Sandbox.
        /// </summary>
        Task<CashfreePgOrderResponse?> GetCashfreeOrderAsync(string cfOrderId);
    }
}
