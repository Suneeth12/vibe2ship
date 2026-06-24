export const env = {
  VITE_API_URL: (import.meta.env.VITE_API_URL as string) || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'),
  VITE_GOOGLE_MAPS_API_KEY: (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '',
};

