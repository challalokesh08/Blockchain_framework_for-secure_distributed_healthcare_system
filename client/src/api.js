import axios from 'axios';

// In dev (npm run dev), the Vite dev server proxies /api to the local backend.
// In production (GitHub Pages), talk to the deployed backend.
const PROD_API = 'https://healthledger-api.onrender.com';
const DEPLOYED = import.meta.env.VITE_API_URL || PROD_API;
const API_BASE = import.meta.env.PROD ? DEPLOYED : '';

const api = axios.create({ baseURL: API_BASE });

export const apiBase = import.meta.env.PROD ? DEPLOYED : window.location.origin;

export default api;
