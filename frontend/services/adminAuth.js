import api from '../lib/api';

const TOKEN_KEY = 'votechain_admin_token';
const PROFILE_KEY = 'votechain_admin_profile';

function getCookieValue(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export const adminAuthService = {
  async login(identifier, password) {
    if (!identifier || typeof identifier !== 'string') {
      throw new Error("Login fallito: Username o Email richiesti.");
    }
    if (!password || typeof password !== 'string') {
      throw new Error("Login fallito: Password o Chiave Privata richiesta.");
    }
    
    try {
      return await api.post('/api/admin/login', {
        identifier,
        privateKey: password, 
      });

    } catch (error) {
      console.error("Admin Login Error:", error);
      throw new Error(error.message || 'Errore durante il login amministratore.');
    }
  },

  saveSession(token, adminProfile) {
    if (typeof window === 'undefined') return;
    
    if (!token) {
      console.error("Tentativo di salvare una sessione senza token.");
      return;
    }

    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(adminProfile));
      
      // Set secure cookie
      const maxAgeSeconds = 60 * 60 * 2;
      document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${maxAgeSeconds}; sameSite=Lax`; 
    } catch (e) {
      console.error("Errore salvataggio sessione:", e);
    }
  },

  clearSession() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(PROFILE_KEY);
      document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; sameSite=Lax`;
    } catch (e) {
      console.error("Errore pulizia sessione:", e);
    }
  },

  isAuthenticated() {
    if (typeof window === 'undefined') return false;

    const token = localStorage.getItem(TOKEN_KEY);
    const cookieToken = getCookieValue(TOKEN_KEY);

    if (token && !cookieToken) {
      this.clearSession();
      return false;
    }

    return !!(token && cookieToken);
  }
};
