import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { sendOtp, verifyOtp } from '../services/authService';
import SpinnerIcon from './icons/SpinnerIcon';

const AuthView: React.FC = () => {
  const { login } = useAppContext();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      await sendOtp(email);
      setIsOtpSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
        setError('Please enter the 6-digit code.');
        return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
        // DEV ONLY: Bypass OTP check for easier development
        if (otp === '123123') {
            console.warn('DEV LOGIN: Bypassing OTP verification.');
            login(email);
            return; // Return early, 'finally' will still run
        }

        const isValid = await verifyOtp(email, otp);
        if (isValid) {
            login(email);
        } else {
            setError('Invalid code. Please try again.');
        }
    } catch (err: any) {
        setError(err.message || 'An unknown error occurred.');
    } finally {
        setIsLoading(false);
    }
  };

  const changeEmail = () => {
    setIsOtpSent(false);
    setOtp('');
    setError(null);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-xl shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-card-foreground">
            Sign in or create an account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            to save your vocabulary progress
          </p>
        </div>
        
        {!isOtpSent ? (
          <form className="mt-8 space-y-6" onSubmit={handleSendCode}>
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-input placeholder:text-muted-foreground text-foreground bg-background focus:outline-none focus:ring-ring focus:border-ring focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50"
              >
                {isLoading ? <SpinnerIcon /> : 'Send Code'}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyCode}>
            <p className="text-center text-sm text-muted-foreground">
              A code was sent to <span className="font-medium text-foreground">{email}</span>.
              <button onClick={changeEmail} type="button" className="font-medium text-primary hover:text-primary/90 ml-2">Change</button>
            </p>
            <div>
              <label htmlFor="otp" className="sr-only">One-time code</label>
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-input placeholder:text-muted-foreground text-foreground bg-background focus:outline-none focus:ring-ring focus:border-ring focus:z-10 sm:text-sm text-center tracking-[0.5em]"
                placeholder="------"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50"
              >
                {isLoading ? <SpinnerIcon /> : 'Verify Code'}
              </button>
            </div>
          </form>
        )}
        {error && <p className="mt-2 text-center text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
};

export default AuthView;