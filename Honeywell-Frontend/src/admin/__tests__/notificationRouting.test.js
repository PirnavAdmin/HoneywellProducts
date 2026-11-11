import test from 'node:test';
import assert from 'node:assert/strict';
import { getNotificationRoute } from '../utils/notificationRouting.js';

test('Notification Routing - Supplier notifications', () => {
  // 1. Supplier updated with quoted name
  const r1 = getNotificationRoute({
    id: 1,
    title: 'Supplier Profile updated',
    message: "Supplier 'Saiteja pvt.ltd' profile details updated.",
    type: 'SupplierUpdated'
  });
  assert.equal(r1, '/admin/suppliers?search=Saiteja%20pvt.ltd');

  // 2. Supplier removed
  const r2 = getNotificationRoute({
    id: 2,
    title: 'Supplier removed',
    message: "Supplier 'Saiteja pvt.ltd' removed from catalog.",
    type: 'SupplierDeleted'
  });
  assert.equal(r2, '/admin/suppliers');

  // 3. New Supplier added
  const r3 = getNotificationRoute({
    id: 3,
    title: 'New Supplier added',
    message: "Supplier 'Acme Corp' added by administrator.",
    type: 'NewSupplier'
  });
  assert.equal(r3, '/admin/suppliers?search=Acme%20Corp');

  // 4. Seller registration / application
  const r4 = getNotificationRoute({
    id: 4,
    title: 'New Seller Application',
    message: 'Seller registration request submitted by John (Acme). Tracking ID: SEL123456',
    type: 'NewSupplier'
  });
  assert.equal(r4, '/admin/suppliers/registrations?search=SEL123456');

  // 5. Seller verified / approved
  const r5 = getNotificationRoute({
    id: 5,
    title: 'Seller Application VERIFIED',
    message: "Seller request for 'Acme' (Tracking ID: SEL123456) has been verified.",
    type: 'SupplierApproved'
  });
  assert.equal(r5, '/admin/suppliers/registrations?search=SEL123456');
});

test('Notification Routing - Orders and Payments', () => {
  const rOrder = getNotificationRoute({
    id: 10,
    title: 'New Order Placed',
    message: 'Order #OD10023 placed by customer John (Total: INR 5000).',
    type: 'NewOrder'
  });
  assert.equal(rOrder, '/admin/orders?search=OD10023');

  const rPay = getNotificationRoute({
    id: 11,
    title: 'Payment Verified',
    message: 'Payment of INR 5000 verified for Order #OD10023.',
    type: 'PaymentReceived'
  });
  assert.equal(rPay, '/admin/payments');
});

test('Notification Routing - Low Stock and Products', () => {
  const rStock = getNotificationRoute({
    id: 20,
    title: 'Low Stock Warning',
    message: 'Dome Camera 4MP is below safety threshold limit (5 left).',
    type: 'LowStock'
  });
  assert.equal(rStock, '/admin/stock-updates');

  const rProd = getNotificationRoute({
    id: 21,
    title: 'New Product Added',
    message: "Product 'Honeywell 4K Bullet' added in Security & Cameras.",
    type: 'NewProduct'
  });
  assert.equal(rProd, '/admin/catalog/products?search=Honeywell%204K%20Bullet');
});

test('Notification Routing - Procurement & Indents', () => {
  const rIndent = getNotificationRoute({
    id: 30,
    title: 'New Purchase Indent Created',
    message: "Indent 'IND-1002' created by Admin.",
    type: 'PurchaseIndent'
  });
  assert.equal(rIndent, '/admin/purchase-indent?search=IND-1002');

  const rPO = getNotificationRoute({
    id: 31,
    title: 'New Purchase Order Created',
    message: "Purchase Order 'PO-2005' created for supplier Acme.",
    type: 'PurchaseOrder'
  });
  assert.equal(rPO, '/admin/purchase-orders?search=PO-2005');
});

test('Notification Routing - Support, Quotes, Staff, Marketing', () => {
  assert.equal(getNotificationRoute({ type: 'SupportTicket', title: 'New Support Ticket' }), '/admin/tickets');
  assert.equal(getNotificationRoute({ type: 'ReturnRequest', title: 'New Return/Replacement Request' }), '/admin/returns');
  assert.equal(getNotificationRoute({ type: 'BulkQuote', title: 'New Bulk Quote Request' }), '/admin/quotes');
  assert.equal(getNotificationRoute({ type: 'DistributorQuote', title: 'New Distributor Quote Request' }), '/admin/quotes');
  assert.equal(getNotificationRoute({ type: 'ContactUs', title: 'New Contact Us Message' }), '/admin/contact-submissions');
  assert.equal(getNotificationRoute({ type: 'StaffAdded', title: 'Staff Added' }), '/admin/staff');
  assert.equal(getNotificationRoute({ type: 'CouponCreated', title: 'Coupon Created' }), '/admin/marketing/coupons');
  assert.equal(getNotificationRoute({ type: 'BrandAdded', title: 'Brand Added' }), '/admin/brands');
  assert.equal(getNotificationRoute({ type: 'BlogCreated', title: 'Blog Created' }), '/admin/blogs');
});

test('Notification Routing - Custom targetUrl / link override', () => {
  assert.equal(getNotificationRoute({ link: '/admin/custom-page' }), '/admin/custom-page');
  assert.equal(getNotificationRoute({ targetUrl: '/admin/orders/123' }), '/admin/orders/123');
});
