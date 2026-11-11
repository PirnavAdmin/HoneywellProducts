/**
 * Resolves the destination admin route for a given notification based on
 * its explicit link/targetUrl property or its type, title, and message context.
 */
export const getNotificationRoute = (notif) => {
  if (!notif) return '/admin/dashboard';
  if (notif.link) return notif.link;
  if (notif.targetUrl) return notif.targetUrl;
  if (notif.url) return notif.url;

  const type = (notif.type || '').trim().toLowerCase();
  const title = (notif.title || '').trim().toLowerCase();
  const message = (notif.message || '').trim();

  // Helper to extract quoted name/id e.g. 'Saiteja pvt.ltd'
  const extractQuotedName = (text) => {
    const match = text.match(/'([^']+)'/);
    return match ? match[1] : null;
  };

  // 1. Seller Registrations & Applications
  if (
    type === 'supplierapproved' ||
    type === 'supplierrejected' ||
    title.includes('seller application') ||
    message.toLowerCase().includes('seller registration') ||
    message.toLowerCase().includes('tracking id:')
  ) {
    const trackingMatch = message.match(/tracking\s*id:\s*([A-Za-z0-9_-]+)/i);
    if (trackingMatch) {
      return `/admin/suppliers/registrations?search=${encodeURIComponent(trackingMatch[1])}`;
    }
    return '/admin/suppliers/registrations';
  }

  // 2. Suppliers Catalog
  if (type.includes('supplier') || title.includes('supplier')) {
    const quotedName = extractQuotedName(message);
    if (quotedName && !type.includes('deleted') && !title.includes('removed')) {
      return `/admin/suppliers?search=${encodeURIComponent(quotedName)}`;
    }
    return '/admin/suppliers';
  }

  // 3. Procurement: Purchase Indents & Purchase Orders (check BEFORE generic customer orders)
  if (type.includes('purchaseindent') || title.includes('purchase indent') || title.includes('indent')) {
    const indentMatch = message.match(/'(IND-[^']+)'/) || message.match(/(IND-\d+)/);
    if (indentMatch) {
      return `/admin/purchase-indent?search=${encodeURIComponent(indentMatch[1])}`;
    }
    return '/admin/purchase-indent';
  }

  if (type.includes('purchaseorder') || title.includes('purchase order')) {
    const poMatch = message.match(/'(PO-[^']+)'/) || message.match(/(PO-\d+)/);
    if (poMatch) {
      return `/admin/purchase-orders?search=${encodeURIComponent(poMatch[1])}`;
    }
    return '/admin/purchase-orders';
  }

  // 4. Payments
  if (type.includes('payment') || title.includes('payment')) {
    return '/admin/payments';
  }

  // 5. Orders, Tracking & Shipping (Customer sales orders)
  if (type.includes('order') || title.includes('order')) {
    if (title.includes('tracking') || type.includes('tracking')) {
      return '/admin/orders/tracking';
    }
    if (title.includes('shipping') || type.includes('shipping')) {
      return '/admin/orders/shipping';
    }
    const orderNumMatch = message.match(/#([A-Za-z0-9_-]+)/);
    if (orderNumMatch) {
      return `/admin/orders?search=${encodeURIComponent(orderNumMatch[1])}`;
    }
    return '/admin/orders';
  }

  // 6. Stock Updates / Low Stock Warning
  if (
    type.includes('lowstock') ||
    type.includes('stock') ||
    title.includes('low stock') ||
    title.includes('stock')
  ) {
    return '/admin/stock-updates';
  }

  // 7. Products, Reviews, Features, Enquiries
  if (type.includes('product') || title.includes('product')) {
    if (type.includes('review') || title.includes('review')) {
      return '/admin/catalog/product-reviews';
    }
    if (type.includes('feature') || title.includes('feature')) {
      return '/admin/catalog/product-features';
    }
    if (type === 'productenquiry' || title.includes('product enquiry')) {
      return '/admin/enquiries';
    }
    const quotedProduct = extractQuotedName(message);
    if (quotedProduct) {
      return `/admin/catalog/products?search=${encodeURIComponent(quotedProduct)}`;
    }
    return '/admin/catalog/products';
  }

  // 8. Categories & Subcategories
  if (type.includes('subcategory') || title.includes('subcategory')) {
    return '/admin/catalog/subcategories';
  }
  if (type.includes('category') || title.includes('category')) {
    return '/admin/catalog/categories';
  }

  // 9. Returns & Warranties
  if (type.includes('return') || title.includes('return') || title.includes('replacement')) {
    if (title.includes('warranty') || type.includes('warranty')) {
      return '/admin/returns/warranty';
    }
    return '/admin/returns';
  }

  // 10. Support Tickets & Service Requests
  if (type.includes('servicerequest') || title.includes('service & repair') || title.includes('service request')) {
    return '/admin/tickets';
  }
  if (type.includes('ticket') || type.includes('support') || title.includes('ticket') || title.includes('support')) {
    return '/admin/tickets';
  }

  // 11. B2B Quotes, Enquiries, Contact Submissions
  if (type.includes('distributorquote') || type.includes('bulkquote') || title.includes('quote')) {
    return '/admin/quotes';
  }
  if (type.includes('contactus') || title.includes('contact')) {
    return '/admin/contact-submissions';
  }
  if (type.includes('enquiry') || title.includes('enquiry')) {
    return '/admin/enquiries';
  }

  // 12. Partner Applications & Growth Journey
  if (type.includes('partner') || title.includes('partner')) {
    return '/admin/growth-journey';
  }

  // 13. Staff
  if (type.includes('staff') || title.includes('staff') || title.includes('employee')) {
    return '/admin/staff';
  }

  // 14. Marketing: Coupons, Banners, Offers
  if (type.includes('coupon') || title.includes('coupon')) {
    return '/admin/marketing/coupons';
  }
  if (type.includes('banner') || title.includes('banner')) {
    return '/admin/marketing/banners';
  }
  if (type.includes('offer') || title.includes('offer')) {
    return '/admin/marketing/offers';
  }

  // 15. Brands & Blogs
  if (type.includes('brand') || title.includes('brand')) {
    return '/admin/brands';
  }
  if (type.includes('blog') || title.includes('blog')) {
    return '/admin/blogs';
  }

  // 16. Customers
  if (type.includes('customer') || title.includes('customer')) {
    return '/admin/customers/list';
  }

  // 17. Invoices
  if (type.includes('invoice') || title.includes('invoice')) {
    return '/admin/invoice';
  }

  // 18. Call History
  if (type.includes('call') || title.includes('call')) {
    return '/admin/call-history';
  }

  // 19. Coins & Loyalty
  if (type.includes('coin') || title.includes('coin')) {
    return '/admin/coins';
  }

  return '/admin/dashboard';
};
