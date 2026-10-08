export const API_BASE_URL = "http://localhost:5000/api";
export const TOKEN_KEY = "railyatra-token";
export const USER_KEY = "railyatra-user";

export type UserRole = "ADMIN" | "CLIENT";

export type CurrentUser = {
  id: number;
  name?: string;
  email: string;
  phone?: string;
  role: UserRole;
};

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): CurrentUser | null {
  const savedUser = localStorage.getItem(USER_KEY);

  if (!savedUser || !getToken()) return null;

  try {
    const user = JSON.parse(savedUser) as CurrentUser;
    return user.role === "ADMIN" || user.role === "CLIENT" ? user : null;
  } catch {
    return null;
  }
}

export function saveAuth(token: string, user: CurrentUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function authenticatedFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  const token = getToken();

  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
}