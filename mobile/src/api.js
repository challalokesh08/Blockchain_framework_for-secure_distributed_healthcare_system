import axios from 'axios';

// Change this URL for different deployments
// Local:       http://YOUR_LAPTOP_IP:4000/api
// Cloud:       https://healthledger-api.onrender.com/api
const API_BASE = 'https://healthledger-api.onrender.com';

const api = axios.create({ baseURL: API_BASE });

export { API_BASE };
export default api;
