/**
 * Document Storage Utility
 * - Persists binary PDF files safely in browser IndexedDB (bypassing 5MB localStorage limit)
 * - Persists document metadata safely in localStorage
 * - Provides immediate preview and download URLs
 */

const DB_NAME = 'HoneywellDocumentsDB';
const DB_VERSION = 1;
const STORE_NAME = 'document_files';
const META_STORE_KEY = 'sat_all_uploaded_documents';

// Helper to open IndexedDB
function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// In-memory binary fallback if IndexedDB is blocked or disabled
const memoryBlobStore = new Map();

/**
 * Save actual PDF File/Blob into IndexedDB
 */
export async function saveDocFile(docId, fileOrBlob) {
  if (!docId || !fileOrBlob) return;
  const key = String(docId);
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(fileOrBlob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save failed, using memory fallback:', err);
    memoryBlobStore.set(key, fileOrBlob);
  }
}

/**
 * Retrieve actual PDF File/Blob from IndexedDB
 */
export async function getDocFile(docId) {
  if (!docId) return null;
  const key = String(docId);
  if (memoryBlobStore.has(key)) {
    return memoryBlobStore.get(key);
  }
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Delete PDF File/Blob from IndexedDB
 */
export async function deleteDocFile(docId) {
  if (!docId) return;
  const key = String(docId);
  memoryBlobStore.delete(key);
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

/**
 * Get all document metadata records from localStorage
 */
export function getLocalMetadataList() {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(META_STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save document metadata records to localStorage (clean metadata only, no binary)
 */
export function saveLocalMetadataList(list) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(META_STORE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Could not save metadata list to localStorage:', err);
  }
}
