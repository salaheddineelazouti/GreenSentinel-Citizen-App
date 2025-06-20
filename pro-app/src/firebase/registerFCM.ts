import { getToken } from 'firebase/messaging';
import { messaging } from './firebase';
import { tokensApi } from '../api/tokensApi';
import { idbStorage, STORAGE_KEYS } from './idbStorage';

/**
 * Request notification permissions and register FCM token with backend
 * @returns Promise resolving to boolean indicating if registration was successful
 */
export const registerFCM = async (): Promise<boolean> => {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }
    
    // Request notification permission
    const permission = await Notification.requestPermission();
    
    // If permission not granted, return false
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return false;
    }
    
    try {
      // Get Firebase messaging token
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_VAPID_KEY
      });
      
      // Store token in IndexedDB
      await idbStorage.set(STORAGE_KEYS.FCM_TOKEN, token);
      
      // Set notifications as enabled
      await idbStorage.set(STORAGE_KEYS.NOTIFICATIONS_ENABLED, 'true');
      
      // Register token with backend
      await tokensApi.postToken(token);
      
      return true;
    } catch (error) {
      console.error('Failed to get or register token:', error);
      return false;
    }
  } catch (error) {
    console.error('Error in registerFCM:', error);
    return false;
  }
};

/**
 * Check if FCM is already registered
 * @returns Promise resolving to boolean indicating if FCM is registered
 */
export const isFCMRegistered = async (): Promise<boolean> => {
  try {
    const enabled = await idbStorage.get(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking FCM registration:', error);
    return false;
  }
};

/**
 * Unregister from FCM notifications
 * @returns Promise resolving to boolean indicating if unregistration was successful
 */
export const unregisterFCM = async (): Promise<boolean> => {
  try {
    await idbStorage.delete(STORAGE_KEYS.FCM_TOKEN);
    await idbStorage.set(STORAGE_KEYS.NOTIFICATIONS_ENABLED, 'false');
    return true;
  } catch (error) {
    console.error('Error unregistering FCM:', error);
    return false;
  }
};
