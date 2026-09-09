import { API_BASE } from './api';

export function getToken() {
  return localStorage.getItem('token');
}

export function getRole() {
  return localStorage.getItem('userRole');
}

export function authHeaders(extra = {}) {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('onboardingComplete');
}

export function logout(navigate) {
  clearSession();
  if (typeof navigate === 'function') {
    navigate('/login', { replace: true });
  } else {
    window.location.assign('/login');
  }
}

/**
 * Authenticated fetch against API_BASE.
 * On 401: clears session and redirects to /login (uses options.navigate if provided).
 */
export async function apiFetch(path, options = {}) {
  const { navigate, headers: optionHeaders, ...rest } = options;
  const url = path.startsWith('http')
    ? path
    : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

  const response = await fetch(url, {
    ...rest,
    headers: {
      ...authHeaders(),
      ...(optionHeaders || {}),
    },
  });

  if (response.status === 401) {
    clearSession();
    if (typeof navigate === 'function') {
      navigate('/login', { replace: true });
    } else {
      window.location.assign('/login');
    }
  }

  return response;
}
