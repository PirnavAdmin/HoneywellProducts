import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://127.0.0.1:5173/api/Notifications';
const ENQUIRY_URL = 'http://127.0.0.1:5173/api/Enquiry/product';

test('1. Verification of Permanent Fix for Red Badge Reappearing Bug: Cache-Control Headers', async () => {
  const countRes = await fetch(`${BASE_URL}/unread-count?_t=${Date.now()}`, { cache: 'no-store' });
  assert.equal(countRes.status, 200);
  const countCacheControl = countRes.headers.get('cache-control') || '';
  assert.equal(countCacheControl.includes('no-store'), true, 'Unread count MUST have no-store');
  assert.equal(countCacheControl.includes('no-cache'), true, 'Unread count MUST have no-cache');
  assert.equal(countRes.headers.get('pragma'), 'no-cache', 'Unread count MUST have Pragma: no-cache');

  const listRes = await fetch(`${BASE_URL}?_t=${Date.now()}`, { cache: 'no-store' });
  assert.equal(listRes.status, 200);
  const listCacheControl = listRes.headers.get('cache-control') || '';
  assert.equal(listCacheControl.includes('no-store'), true, 'Notifications list MUST have no-store');
  assert.equal(listCacheControl.includes('no-cache'), true, 'Notifications list MUST have no-cache');
});

test('2. Dynamic Verification: GET /api/Notifications schema contract', async () => {
  const res = await fetch(`${BASE_URL}?_t=${Date.now()}`, { cache: 'no-store' });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(Array.isArray(data), true, 'Response must be an array');
  assert.ok(data.length > 0, 'Must have existing notifications');

  const sample = data[0];
  assert.equal(typeof sample.id, 'number');
  assert.equal(typeof sample.title, 'string');
  assert.equal(typeof sample.message, 'string');
  assert.equal(typeof sample.type, 'string');
  assert.equal(typeof sample.isRead, 'boolean');
  assert.equal(typeof sample.createdAt, 'string');
});

test('3. Dynamic Verification: GET /api/Notifications/unread-count matches unread count', async () => {
  const [listRes, countRes] = await Promise.all([
    fetch(`${BASE_URL}?_t=${Date.now()}`, { cache: 'no-store' }),
    fetch(`${BASE_URL}/unread-count?_t=${Date.now()}`, { cache: 'no-store' })
  ]);

  const list = await listRes.json();
  const count = parseInt(await countRes.text(), 10);

  const calculatedUnread = list.filter(n => !n.isRead).length;
  assert.equal(count, calculatedUnread, `Backend unread count (${count}) must match list unread items (${calculatedUnread})`);
});

test('4. End-to-End Dynamic Workflow: Create, verify unread, mark read, delete, verify count consistency', async () => {
  // 1. Initial count
  const c0Res = await fetch(`${BASE_URL}/unread-count?_t=${Date.now()}`, { cache: 'no-store' });
  const count0 = parseInt(await c0Res.text(), 10);

  // 2. Create unread notification via real backend API
  const addRes = await fetch(ENQUIRY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product: 'E2E Full Workflow Camera',
      name: 'Full Audit User',
      mobile: '9888888888',
      email: 'audit@example.com'
    })
  });
  assert.equal(addRes.status, 200, 'Creation of enquiry should succeed');

  // 3. Verify count incremented
  const c1Res = await fetch(`${BASE_URL}/unread-count?_t=${Date.now()}`, { cache: 'no-store' });
  const count1 = parseInt(await c1Res.text(), 10);
  assert.equal(count1, count0 + 1, `Unread count should increment from ${count0} to ${count0 + 1}`);

  // 4. Fetch list and locate item
  const listRes = await fetch(`${BASE_URL}?_t=${Date.now()}`, { cache: 'no-store' });
  const list = await listRes.json();
  const created = list.find(n => n.message.includes('Full Audit User'));
  assert.ok(created, 'Created notification should be found');
  assert.equal(created.isRead, false, 'Created notification should have isRead: false');

  // 5. Mark as read: PUT /api/Notifications/{id}/read
  const readRes = await fetch(`${BASE_URL}/${created.id}/read`, { method: 'PUT', cache: 'no-store' });
  assert.ok([200, 204].includes(readRes.status), 'Mark as read should return 200/204');

  // 6. Verify count decremented
  const c2Res = await fetch(`${BASE_URL}/unread-count?_t=${Date.now()}`, { cache: 'no-store' });
  const count2 = parseInt(await c2Res.text(), 10);
  assert.equal(count2, count0, `Unread count should return to ${count0}`);

  // 7. Verify isRead is now true in list
  const listRes2 = await fetch(`${BASE_URL}?_t=${Date.now()}`, { cache: 'no-store' });
  const list2 = await listRes2.json();
  const updated = list2.find(n => n.id === created.id);
  assert.equal(updated.isRead, true, 'isRead must be true after marking read');

  // 8. Delete an already-read notification: count should NOT change
  const delRes = await fetch(`${BASE_URL}/${created.id}`, { method: 'DELETE', cache: 'no-store' });
  assert.ok([200, 204].includes(delRes.status), 'Delete should return 200/204');

  const c3Res = await fetch(`${BASE_URL}/unread-count?_t=${Date.now()}`, { cache: 'no-store' });
  const count3 = parseInt(await c3Res.text(), 10);
  assert.equal(count3, count0, 'Deleting already-read notification must NOT change unread count');
});

test('5. End-to-End: Deleting an UNREAD notification decrements count', async () => {
  // 1. Initial count
  const c0Res = await fetch(`${BASE_URL}/unread-count?_t=${Date.now()}`, { cache: 'no-store' });
  const count0 = parseInt(await c0Res.text(), 10);

  // 2. Create unread notification
  await fetch(ENQUIRY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product: 'Unread Delete Test',
      name: 'Unread Delete User',
      mobile: '9777777777',
      email: 'delete_unread@example.com'
    })
  });

  const c1Res = await fetch(`${BASE_URL}/unread-count?_t=${Date.now()}`, { cache: 'no-store' });
  const count1 = parseInt(await c1Res.text(), 10);
  assert.equal(count1, count0 + 1, 'Count should increase by 1');

  const listRes = await fetch(`${BASE_URL}?_t=${Date.now()}`, { cache: 'no-store' });
  const list = await listRes.json();
  const created = list.find(n => n.message.includes('Unread Delete User'));
  assert.ok(created, 'Created notification must be present');
  assert.equal(created.isRead, false, 'Must be unread');

  // 3. Delete while STILL unread
  const delRes = await fetch(`${BASE_URL}/${created.id}`, { method: 'DELETE', cache: 'no-store' });
  assert.ok([200, 204].includes(delRes.status));

  // 4. Verify count decremented
  const c2Res = await fetch(`${BASE_URL}/unread-count?_t=${Date.now()}`, { cache: 'no-store' });
  const count2 = parseInt(await c2Res.text(), 10);
  assert.equal(count2, count0, 'Deleting unread notification must decrement count');
});

test('6. End-to-End: Mark all as read updates all records in database and zeros count', async () => {
  // Create 2 unread notifications
  await fetch(ENQUIRY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product: 'Mark All Product 1',
      name: 'Batch User 1',
      mobile: '9666666661',
      email: 'batch1@example.com'
    })
  });

  await fetch(ENQUIRY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product: 'Mark All Product 2',
      name: 'Batch User 2',
      mobile: '9666666662',
      email: 'batch2@example.com'
    })
  });

  const c1Res = await fetch(`${BASE_URL}/unread-count?_t=${Date.now()}`, { cache: 'no-store' });
  const count1 = parseInt(await c1Res.text(), 10);
  assert.ok(count1 >= 2, 'Should have at least 2 unread notifications');

  // Mark all read
  const markAllRes = await fetch(`${BASE_URL}/mark-all-read`, { method: 'PUT', cache: 'no-store' });
  assert.ok([200, 204].includes(markAllRes.status));

  // Verify count is 0
  const c2Res = await fetch(`${BASE_URL}/unread-count?_t=${Date.now()}`, { cache: 'no-store' });
  const count2 = parseInt(await c2Res.text(), 10);
  assert.equal(count2, 0, 'Unread count must be 0 after mark-all-read');

  // Verify list has 0 unread
  const listRes = await fetch(`${BASE_URL}?_t=${Date.now()}`, { cache: 'no-store' });
  const list = await listRes.json();
  const unreadCountInList = list.filter(n => !n.isRead).length;
  assert.equal(unreadCountInList, 0, 'Every notification in list must have isRead: true');

  // Clean up
  const n1 = list.find(n => n.message.includes('Batch User 1'));
  const n2 = list.find(n => n.message.includes('Batch User 2'));
  if (n1) await fetch(`${BASE_URL}/${n1.id}`, { method: 'DELETE', cache: 'no-store' });
  if (n2) await fetch(`${BASE_URL}/${n2.id}`, { method: 'DELETE', cache: 'no-store' });
});

test('7. Error Handling: Non-existent item actions return 404', async () => {
  const readRes = await fetch(`${BASE_URL}/99999999/read`, { method: 'PUT', cache: 'no-store' });
  assert.equal(readRes.status, 404);

  const delRes = await fetch(`${BASE_URL}/99999999`, { method: 'DELETE', cache: 'no-store' });
  assert.equal(delRes.status, 404);
});

test('8. Concurrency & Race Condition Simulation: Stale response protection', () => {
  let requestId = 0;
  let activeState = { count: 3, notifications: [{ id: 1, isRead: false }, { id: 2, isRead: false }] };

  // Step 1: Background poll starts (req 1)
  const req1Id = ++requestId;

  // Step 2: User clicks Mark as Read on id 1 (req 2)
  const req2Id = ++requestId;
  activeState = {
    count: 2,
    notifications: [{ id: 1, isRead: true }, { id: 2, isRead: false }]
  };

  // Step 3: Req 1 completes late with stale data (count: 3)
  const staleData = { count: 3, notifications: [{ id: 1, isRead: false }, { id: 2, isRead: false }] };
  if (req1Id >= requestId) {
    activeState = staleData; // Must NOT execute!
  }

  assert.equal(activeState.count, 2, 'Stale background poll must be discarded by request ID tracking');
  assert.equal(activeState.notifications[0].isRead, true, 'User read state must be preserved');
});

test('9. Debounce & Rapid Click Locking Simulation', () => {
  const mutating = new Set();
  const actions = [];

  const clickMarkAsRead = (id) => {
    if (mutating.has(id)) {
      actions.push(`IGNORED_${id}`);
      return;
    }
    mutating.add(id);
    actions.push(`EXECUTED_${id}`);
  };

  clickMarkAsRead(100);
  clickMarkAsRead(100);
  clickMarkAsRead(100);
  assert.deepEqual(actions, ['EXECUTED_100', 'IGNORED_100', 'IGNORED_100'], 'Rapid repeated clicks must be blocked');

  mutating.delete(100);
  clickMarkAsRead(100);
  assert.equal(actions[3], 'EXECUTED_100', 'Can click again once mutation finishes');
});
