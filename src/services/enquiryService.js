// Frontend demo only. Replace with POST /api/enquiries when the backend is available.
export const enquiryService = {
  async submit(payload) {
    await new Promise((resolve) => setTimeout(resolve, 650));
    return { ok: true, reference: `DEMO-${Date.now()}`, payload };
  },
};
