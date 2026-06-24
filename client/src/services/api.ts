import axios from 'axios';
import { auth } from '../config/firebase';
import { env } from '../config/env';

export const api = axios.create({
  baseURL: env.VITE_API_URL,
});

// Interceptor to inject Firebase Auth ID Token into all requests
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } else if (localStorage.getItem('is_mock_session') === 'true') {
        const mockUid = localStorage.getItem('demo_user_uid') || 'demo_user_id';
        config.headers.Authorization = `Bearer demo_token_${mockUid}`;
      }
    } catch (err) {
      console.warn('Could not retrieve auth token for request interceptor:', err);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
