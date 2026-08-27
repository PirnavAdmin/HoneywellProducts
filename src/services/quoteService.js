// Frontend mock. Replace with POST /api/bulk-quotes when the ASP.NET Core API is available.
export const quoteService = {
  async submit(payload) {
    await new Promise((resolve) => setTimeout(resolve, 650));
    return { ok: true, reference: `DEMO-QUOTE-${Date.now()}`, payload };
  },
};
