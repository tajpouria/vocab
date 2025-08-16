// This is a mock authentication service.
// In a real application, this would involve making API calls to a backend server.

const OTP_KEY = 'auth-otp';
const OTP_EMAIL_KEY = 'auth-otp-email';

/**
 * Simulates sending an OTP to the user's email.
 * For this demo, it stores the OTP in sessionStorage and logs it to the console.
 */
export const sendOtp = async (email: string): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
      sessionStorage.setItem(OTP_KEY, otp);
      sessionStorage.setItem(OTP_EMAIL_KEY, email);
      
      // In a real app, you would send an email here.
      // For demonstration purposes, we'll log it to the console.
      console.log(`
      ====================================
      OTP Sent to ${email}
      Your verification code is: ${otp}
      ====================================
      `);
      
      resolve();
    }, 1000); // Simulate network latency
  });
};

/**
 * Verifies the provided OTP against the stored one.
 */
export const verifyOtp = async (email: string, otp: string): Promise<boolean> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const storedOtp = sessionStorage.getItem(OTP_KEY);
            const storedEmail = sessionStorage.getItem(OTP_EMAIL_KEY);
            
            if (storedOtp === otp && storedEmail === email) {
                sessionStorage.removeItem(OTP_KEY);
                sessionStorage.removeItem(OTP_EMAIL_KEY);
                resolve(true);
            } else {
                resolve(false);
            }
        }, 500);
    });
};
