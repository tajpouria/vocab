import { API_BASE } from "../constants/api";
import { Session } from "../types";

// Session storage utilities
const SESSION_KEY = 'vocab_session';

export const getStoredSession = (): Session | null => {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    
    const session: Session = JSON.parse(stored);
    
    // Check if session is expired
    if (session.expires <= Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error getting stored session:', error);
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const storeSession = (session: Session): void => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Error storing session:', error);
  }
};

export const clearSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
};

export const getAuthHeaders = (): Record<string, string> => {
  const session = getStoredSession();
  if (!session) {
    return {};
  }
  
  return {
    'Authorization': `Bearer ${session.id}`,
  };
};

// Auth API functions
export const sendOtp = async (email: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to send OTP');
  }
};

export const verifyOtp = async (email: string, otp: string): Promise<Session> => {
  const response = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to verify OTP');
  }
  
  const data = await response.json();
  const session: Session = data.session;
  
  // Store session in localStorage
  storeSession(session);
  
  return session;
};

export const validateSession = async (): Promise<{ email: string } | null> => {
  try {
    const headers = getAuthHeaders();
    if (!headers.Authorization) return null;
    
    const response = await fetch(`${API_BASE}/auth/validate`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
    
    if (!response.ok) {
      clearSession();
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error validating session:', error);
    clearSession();
    return null;
  }
};

export const logout = async (): Promise<void> => {
  try {
    const headers = getAuthHeaders();
    
    if (headers.Authorization) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });
    }
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    clearSession();
  }
};

export const isAuthenticated = (): boolean => {
  return getStoredSession() !== null;
};
