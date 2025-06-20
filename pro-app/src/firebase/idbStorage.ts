import { openDB } from 'idb';

interface FCMStorage {
  key: string;
  value: string;
}

const DB_NAME = 'greensentinel-fcm';
const STORE_NAME = 'fcm-store';
const DB_VERSION = 1;

// Initialize IndexedDB
const dbPromise = openDB<FCMStorage>(DB_NAME, DB_VERSION, {
  upgrade(db) {
    db.createObjectStore(STORE_NAME);
  },
});

/**
 * Storage utility for FCM token and notification preferences using IndexedDB
 */
export const idbStorage = {
  /**
   * Save a value in IndexedDB storage
   * @param key The storage key
   * @param value The value to store
   */
  set: async (key: string, value: string): Promise<IDBValidKey> => {
    return (await dbPromise).put(STORE_NAME, value, key);
  },
  
  /**
   * Get a value from IndexedDB storage
   * @param key The storage key
   * @returns The stored value or null if not found
   */
  get: async (key: string): Promise<string | undefined> => {
    return (await dbPromise).get(STORE_NAME, key);
  },
  
  /**
   * Delete a value from IndexedDB storage
   * @param key The storage key to delete
   */
  delete: async (key: string): Promise<void> => {
    return (await dbPromise).delete(STORE_NAME, key);
  }
};

// Keys used for storage
export const STORAGE_KEYS = {
  FCM_TOKEN: 'fcm_token',
  NOTIFICATIONS_ENABLED: 'notifications_enabled'
};
