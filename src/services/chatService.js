import { siteConfig } from '../config/siteConfig';

// Frontend mock. Replace with POST /api/chat when the ASP.NET Core API is available.
export const chatService = {
  async send(message) {
    await new Promise((resolve) => setTimeout(resolve, 450));
    const lower = message.toLowerCase();
    if (lower.includes('cctv') || lower.includes('camera') || lower.includes('surveillance')) return { message: 'Open Products to explore CCTV, IP and AI surveillance camera types. Use Enquire on any product to associate it with your enquiry.' };
    if (lower.includes('solar') || lower.includes('energy')) return { message: 'Open Products and choose Solar Cameras to explore solar-assisted CCTV, 4G security cameras and surveillance kits.' };
    if (lower.includes('bulk') || lower.includes('quote')) return { message: 'Use Get a Quote in the header or Request Bulk Quote on a product page. The product can be preselected for your request.' };
    if (lower.includes('enquiry') || lower.includes('enquire')) return { message: 'Select Enquire on a product and provide your name and 10-digit mobile number. Email is optional.' };
    if (lower.includes('distributor')) return { message: 'Open Business and choose Distributor Opportunities to submit your interest. Final program details will be provided by the client.' };
    if (lower.includes('partner')) return { message: 'Open Business and choose Partner Benefits to review the placeholder topics and submit your interest.' };
    if (lower.includes('franchise')) return { message: 'Open Business and choose Franchise Opportunity to request client-approved franchise information.' };
    if (lower.includes('contact') || lower.includes('support') || lower.includes('sales')) return { message: `Contact Honeywell Products at ${siteConfig.email} or ${siteConfig.phone}. Our office is at ${siteConfig.address}` };
    if (lower.includes('product') || lower.includes('detail')) return { message: 'Open Products to filter by category and product type, then choose Details or Enquire on any product card.' };
    return { message: 'This is a frontend demo assistant. I can help with CCTV products, solar products, product enquiries, distributors, partners, franchises and contact information.' };
  },
};
