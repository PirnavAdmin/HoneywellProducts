import test from 'node:test';
import assert from 'node:assert/strict';

const BACKEND_URL = 'https://drab-smoking-unstaffed.ngrok-free.dev';

const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'ngrok-skip-browser-warning': 'true',
};

test('Payment API Integration Test Suite', async (t) => {
  let createdOrderId = null;
  let createdOrderNumber = null;

  await t.test('1. Create verified test order for payment tests', async () => {
    const orderNum = `ORD-E2E-${Date.now()}`;
    const payload = {
      orderNumber: orderNum,
      customerName: 'Integration Test Customer',
      customerType: 'Customer Account',
      email: 'payment.test@example.com',
      mobile: '9876543210',
      address: '77 Cyber Tech Park, Sector 44, Gurugram, Haryana, 122002',
      city: 'Gurugram',
      state: 'Haryana',
      pinCode: '122002',
      totalAmount: 9999,
      gstAmount: 1800,
      finalAmount: 11799,
      paymentMethod: 'Cashfree',
      paymentStatus: 'Pending',
      status: 'Processing',
      items: [
        {
          productId: 106,
          productName: 'Honeywell 2MP 4X AcuSense IR Network Dome PTZ Camera',
          quantity: 1,
          price: 9999,
          subtotal: 9999
        }
      ]
    };

    const res = await fetch(`${BACKEND_URL}/api/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.id, 'Expected numeric order id');
    assert.equal(data.orderNumber, orderNum, 'Expected matching order number');

    createdOrderId = data.id;
    createdOrderNumber = data.orderNumber;
  });

  await t.test('2. POST /api/Payment/cashfree/create-order generates valid sandbox paymentSessionId', async () => {
    assert.ok(createdOrderId, 'Requires order from step 1');

    const payload = {
      orderId: String(createdOrderId),
      customerEmail: 'payment.test@example.com',
      customerPhone: '9876543210',
      returnUrl: 'http://localhost:5173/order-success?order_id={order_id}',
      idempotencyKey: `idemp_${createdOrderId}_${Date.now()}`
    };

    const res = await fetch(`${BACKEND_URL}/api/Payment/cashfree/create-order`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
    const data = await res.json();

    assert.equal(data.success, true, 'Expected success=true');
    assert.ok(data.paymentSessionId, 'Expected non-empty paymentSessionId');
    assert.match(data.paymentSessionId, /^session_/, 'paymentSessionId should start with session_');
    assert.ok(data.cfOrderId, 'Expected non-empty cfOrderId');
    assert.equal(data.orderId, createdOrderId, 'Expected matching orderId');
    assert.equal(data.environment, 'sandbox', 'Expected environment=sandbox');
  });

  await t.test('3. GET /api/Payment/cashfree/order/{orderRef} retrieves verified transaction', async () => {
    assert.ok(createdOrderId, 'Requires order from step 1');

    const res = await fetch(`${BACKEND_URL}/api/Payment/cashfree/order/${createdOrderId}`, {
      method: 'GET',
      headers
    });

    assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
    const data = await res.json();

    assert.equal(data.success, true, 'Expected success=true');
    assert.equal(data.orderId, createdOrderId);
    assert.equal(data.orderNumber, createdOrderNumber);
    assert.equal(data.gateway, 'Cashfree');
    assert.ok(data.paymentSessionId);
    assert.ok(data.status);
  });

  await t.test('4. GET /api/Payment/bank-details returns corporate banking configuration', async () => {
    const res = await fetch(`${BACKEND_URL}/api/Payment/bank-details`, {
      method: 'GET',
      headers
    });

    assert.equal(res.status, 200);
    const data = await res.json();

    assert.ok(data.accountHolderName);
    assert.ok(data.bankName);
    assert.ok(data.accountNumber);
    assert.ok(data.ifscCode);
    assert.ok(data.branch);
  });

  await t.test('5. GET /api/Payment/upi-details returns merchant VPA configuration', async () => {
    const res = await fetch(`${BACKEND_URL}/api/Payment/upi-details`, {
      method: 'GET',
      headers
    });

    assert.equal(res.status, 200);
    const data = await res.json();

    assert.ok(data.merchantName);
    assert.ok(data.merchantUpiId);
    assert.ok(data.currency);
  });

  await t.test('6. GET /api/Payment/qr/{orderId} returns dynamic order QR payload', async () => {
    const res = await fetch(`${BACKEND_URL}/api/Payment/qr/${createdOrderNumber}?amount=11799`, {
      method: 'GET',
      headers
    });

    assert.equal(res.status, 200);
    const data = await res.json();

    assert.equal(data.success, true);
    assert.ok(data.qrPayload);
    assert.match(data.qrPayload, /^upi:\/\/pay\?/);
    assert.ok(data.transactionId);
  });

  await t.test('7. POST /api/Payment/initiate creates a pending transaction', async () => {
    const res = await fetch(`${BACKEND_URL}/api/Payment/initiate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        paymentMethod: 'UPI',
        amount: 11799,
        orderId: createdOrderNumber,
        upiId: 'test@okaxis'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();

    assert.ok(data.transactionId);
    assert.equal(data.paymentStatus, 'Pending');
    assert.ok(data.upiDeepLink);
  });

  await t.test('8. Error Handling: Non-existent order returns HTTP 404', async () => {
    const res = await fetch(`${BACKEND_URL}/api/Payment/cashfree/create-order`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        orderId: 'ORD-DOES-NOT-EXIST-999999'
      })
    });

    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /not found/i);
  });

  await t.test('9. Error Handling: Missing OrderId returns HTTP 400', async () => {
    const res = await fetch(`${BACKEND_URL}/api/Payment/cashfree/create-order`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        orderId: ''
      })
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /OrderId is required/i);
  });
});
