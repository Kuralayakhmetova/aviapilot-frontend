import api from './api';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// ─────────────────────────────
// accessToken storage
// ─────────────────────────────

function setAccessToken(token: string) {
  localStorage.setItem('accessToken', token);
}

export function getAccessToken() {
  return localStorage.getItem('accessToken');
}

function clearAccessToken() {
  localStorage.removeItem('accessToken');
}

// ─────────────────────────────
// AUTH
// ─────────────────────────────

export async function register(data: RegisterData) {
  const response = await api.post('/auth/register', data);

  setAccessToken(response.data.data.accessToken);
  return response.data;
}

export async function login(data: LoginData) {
  const response = await api.post('/auth/login', data);

  setAccessToken(response.data.data.accessToken);
  return response.data;
}

export async function logout() {
  await api.post('/auth/logout');
  clearAccessToken();
}

// ─────────────────────────────
// USER
// ─────────────────────────────

export async function getMe() {
  const response = await api.get('/auth/profile');
  return response.data.data.user;
}

// ─────────────────────────────
// REFRESH
// ─────────────────────────────

export async function refreshToken() {
  const response = await api.post('/auth/refresh');

  const newToken = response.data.data.accessToken;
  setAccessToken(newToken);

  return newToken;
}

// ─────────────────────────────
//auth/me

export async function getProfile() {
  const response = await api.get('/auth/me');
  return response.data.data.user;
} 