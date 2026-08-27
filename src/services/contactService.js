// Frontend mock. Replace with POST /api/contact when the ASP.NET Core API is available.
export const contactService = {
  async submit(payload) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { ok: true, payload };
  },
};
