import axios from 'axios';

// Web and mobile MUST share the same backend so an approval on one device is
// visible on the other. Default to the deployed API in development too.
// To develop against localhost:4000 instead, run with VITE_USE_LOCAL_API=1.
const PROD_API = 'https://healthledger-api.onrender.com';
const USE_LOCAL = import.meta.env.VITE_USE_LOCAL_API === '1';
const DEPLOYED = import.meta.env.VITE_API_URL || PROD_API;
const API_BASE = USE_LOCAL ? '' : DEPLOYED;

const api = axios.create({ baseURL: API_BASE });

export const apiBase = API_BASE || window.location.origin;

export default api;
