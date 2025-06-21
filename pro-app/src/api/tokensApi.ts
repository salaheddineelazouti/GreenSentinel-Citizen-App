import axios from 'axios';

const API_URL = import.meta.env.VITE_API_HOST || 'http://localhost:8000';

/**
 * TokensAPI - Handles device token registration with backend
 */
export const tokensApi = {
  /**
   * Post FCM device token to backend
   * @param token Firebase Cloud Messaging device token
   * @returns Promise resolving to successful response
   */
  postToken: async (token: string): Promise<void> => {
    try {
      // Send token to backend
      await axios.post(
        `${API_URL}/api/v1/tokens`, 
        { token },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );
    } catch (error) {
      console.error('Error registering FCM token with backend:', error);
      throw error;
    }
  }
};
