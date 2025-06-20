import { useState, useEffect, useCallback } from 'react';
import { registerFCM, isFCMRegistered, unregisterFCM } from '../firebase/registerFCM';

/**
 * Hook for managing notification state and permissions
 * @returns Object with enabled state and functions to enable/disable notifications
 */
export const useNotifications = () => {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission | 'default'>('default');
  const [loading, setLoading] = useState<boolean>(true);

  // Check current notification state on mount
  useEffect(() => {
    const checkNotificationStatus = async () => {
      try {
        // Check if notifications are enabled in IDB
        const isEnabled = await isFCMRegistered();
        setEnabled(isEnabled);
        
        // Check browser permission status
        if ('Notification' in window) {
          setPermission(Notification.permission);
        }
      } catch (error) {
        console.error('Error checking notification status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkNotificationStatus();
  }, []);

  /**
   * Request to enable notifications
   * @returns Promise resolving to boolean indicating success
   */
  const requestEnable = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const result = await registerFCM();
      setEnabled(result);
      
      if ('Notification' in window) {
        setPermission(Notification.permission);
      }
      
      return result;
    } catch (error) {
      console.error('Error requesting notification enable:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Disable notifications
   * @returns Promise resolving to boolean indicating success
   */
  const disable = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const result = await unregisterFCM();
      setEnabled(false);
      return result;
    } catch (error) {
      console.error('Error disabling notifications:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    enabled,
    permission,
    loading,
    requestEnable,
    disable
  };
};
