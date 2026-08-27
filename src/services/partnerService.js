// Frontend mock. Replace with POST /api/partner-applications when the ASP.NET Core API is available.
export const partnerService = {
  async submit(payload) {
    await new Promise((resolve) => setTimeout(resolve, 650));
    return { ok: true, reference: `DEMO-PARTNER-${Date.now()}`, payload };
  },
};
