import axios from 'axios';

// The base URL for the C# API
// In development, ASP.NET Core usually runs on https://localhost:5001 or http://localhost:5000
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5105';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach the JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
