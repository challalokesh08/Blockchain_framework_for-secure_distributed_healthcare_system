import axios from 'axios';

const API_BASE = 'https://healthledger-api.onrender.com';

const api = axios.create({ baseURL: API_BASE });

export default api;
