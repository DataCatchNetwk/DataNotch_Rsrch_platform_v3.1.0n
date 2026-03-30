import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  config.headers['x-user-id'] = process.env.NEXT_PUBLIC_DEMO_USER_ID || 'demo-user-id';
  return config;
});
