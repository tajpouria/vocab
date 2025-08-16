const API_BASE = 'http://localhost:3001/api';

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

export const verifyOtp = async (email: string, otp: string): Promise<boolean> => {
  const response = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  
  return response.ok;
};
