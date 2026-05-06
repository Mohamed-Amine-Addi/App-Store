import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach JWT to every request if available
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('mas_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ── Apps ──────────────────────────────────────────────────────────────────
export const getApps         = (category) => api.get('/apps', { params: category ? { category } : {} }).then(r => r.data);
export const getCategories   = ()          => api.get('/apps/categories').then(r => r.data);
export const getInstalledApps= ()          => api.get('/installed').then(r => r.data);
export const installApp      = (appId)     => api.post('/install',    { app_id: appId }).then(r => r.data);
export const uninstallApp    = (appId)     => api.delete('/uninstall',{ data:{ app_id: appId } }).then(r => r.data);
export const runApp          = (name, args={}) => api.post(`/run/${name}`, args).then(r => r.data);
export const getHistory      = ()          => api.get('/history').then(r => r.data);

// ── Auth ──────────────────────────────────────────────────────────────────
export const authRegister      = (data)  => api.post('/auth/register',         data).then(r => r.data);
export const authVerify        = (data)  => api.post('/auth/verify',            data).then(r => r.data);
export const authLogin         = (data)  => api.post('/auth/login',             data).then(r => r.data);
export const authMe            = ()      => api.get('/auth/me').then(r => r.data);
export const authUpdate        = (data)  => api.put('/auth/update',             data).then(r => r.data);
export const authChangePassword= (data)  => api.put('/auth/change-password',    data).then(r => r.data);
