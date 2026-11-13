const SESSION_KEY = 'oud-aura:admin';
export const DEMO_EMAIL = 'admin@oudandaura.demo';
export const DEMO_PASSWORD = 'AuraDemo2026!';

export function isLoggedIn() {
  try { return sessionStorage.getItem(SESSION_KEY) === 'demo-session'; }
  catch { return false; }
}

export function login(email, password) {
  if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) throw new Error('The demo email or password is incorrect.');
  try { sessionStorage.setItem(SESSION_KEY, 'demo-session'); }
  catch { throw new Error('Session storage is blocked. Allow site storage to use the demo admin.'); }
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}
