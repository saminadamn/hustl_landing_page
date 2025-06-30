import React, { useState, useEffect } from 'react';
import { Mail, Lock, AlertCircle, Loader, User, X, KeyRound, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { validateUFEmail } from '../lib/auth';
import * as Sentry from "@sentry/react";

interface AuthProps {
  initialMode?: 'signin' | 'signup';
  onClose?: () => void;
}

const Auth: React.FC<AuthProps> = ({ initialMode = 'signin', onClose }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [fullName, setFullName] = useState('');
  const [major, setMajor] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const supportEmail = 'hustl.x@outlook.com';
  const supportMailto = `mailto:${supportEmail}?subject=Account Support Request`;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    // Trim whitespace from email and password
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      toast.error('Please enter both email and password');
      return;
    }

    // Special handling for admin accounts
    const adminAccounts = ['kaushalthota1@gmail.com', 'apoorvamahajan94@gmail.com'];
    const isAdminAccount = adminAccounts.includes(trimmedEmail);

    if (isSignUp) {
      // Don't allow signing up with admin email
      if (isAdminAccount) {
        toast.error('This email address cannot be used for registration');
        return;
      }

      // Validate UF email
      if (!validateUFEmail(trimmedEmail)) {
        toast.error('Please use your UF email address (@ufl.edu)');
        return;
      }

      // Validate password length
      if (trimmedPassword.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }

      // Validate password match
      if (trimmedPassword !== confirmPassword.trim()) {
        toast.error('Passwords do not match');
        return;
      }

      // Validate full name for signup
      if (!fullName.trim()) {
        toast.error('Please enter your full name');
        return;
      }
    } else {
      // For sign in, validate email format unless it's an admin account
      if (!isAdminAccount && !validateUFEmail(trimmedEmail)) {
        toast.error('Please use your UF email address (@ufl.edu)');
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
        const user = userCredential.user;
        
        // Update display name
        await updateProfile(user, {
          displayName: fullName
        });
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'profiles', user.uid), {
          id: user.uid,
          full_name: fullName.trim(),
          email: trimmedEmail,
          major: major.trim() || null,
          is_verified: false,
          verification_level: 'none',
          show_tutorial: true,
          tutorial_completed: false,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
        
        // Create user stats
        await setDoc(doc(db, 'user_stats', user.uid), {
          user_id: user.uid,
          points: 0,
          tasks_completed: 0,
          total_earnings: 0,
          average_rating: 0,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
        
        // Create wallet
        await setDoc(doc(db, 'wallets', user.uid), {
          user_id: user.uid,
          balance: 0,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
        
        toast.success('Account created successfully! You can now sign in.');
        setSignupSuccess(true);
        
        // Log signup in Sentry
        Sentry.captureMessage("User signed up successfully", "info");
        
        // Clear form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setFullName('');
        setMajor('');
      } else {
        // Sign in with Firebase Auth
        await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
        toast.success('Welcome back!');
        
        // Log signin in Sentry
        Sentry.captureMessage("User signed in successfully", "info");
        
        if (onClose) onClose();
      }
    } catch (error: any) {
      console.error('Detailed auth error:', error);
      
      // Log auth error in Sentry
      Sentry.captureException(error, {
        tags: {
          action: isSignUp ? 'signup' : 'signin',
          email_domain: trimmedEmail.split('@')[1] || 'unknown'
        }
      });
      
      // Handle specific error cases with consistent messaging for credential errors
      if (error.code === 'auth/invalid-credential' || 
          error.code === 'auth/user-not-found' || 
          error.code === 'auth/wrong-password') {
        toast.error('Invalid email or password. Please check your credentials and try again');
      } else if (error.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered. Please sign in instead');
        setIsSignUp(false);
      } else if (error.code === 'auth/user-disabled') {
        toast.error('This account has been disabled. Please contact support for assistance');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many failed attempts. Please try again later or reset your password');
      } else if (error.code === 'auth/network-request-failed') {
        toast.error('Network error. Please check your connection and try again');
      } else {
        toast.error(error.message || 'An unexpected error occurred. Please try again later or contact support.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = resetEmail.trim().toLowerCase();

    if (!trimmedEmail) {
      toast.error('Please enter your email address');
      return;
    }

    // Special handling for admin accounts
    const adminAccounts = ['kaushalthota1@gmail.com', 'apoorvamahajan94@gmail.com'];
    const isAdminAccount = adminAccounts.includes(trimmedEmail);

    // Validate email format
    if (!isAdminAccount && !validateUFEmail(trimmedEmail)) {
      toast.error('Please use your UF email address (@ufl.edu)');
      return;
    }

    setResetLoading(true);

    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      toast.success('Password reset email sent! Please check your inbox and follow the instructions.');
      setShowResetPassword(false);
      setResetEmail('');
      
      // Log password reset in Sentry
      Sentry.captureMessage("Password reset requested", "info", {
        email: trimmedEmail
      });
    } catch (error: any) {
      console.error('Reset password error:', error);
      
      // Handle specific password reset errors
      if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email address. Please check your email or sign up for a new account.');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Please enter a valid email address.');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many password reset requests. Please try again later.');
      } else {
        toast.error(error.message || 'Error sending reset email. Please try again.');
      }
      
      // Log password reset error in Sentry
      Sentry.captureException(error, {
        tags: {
          action: 'password_reset',
          email_domain: trimmedEmail.split('@')[1] || 'unknown'
        }
      });
    } finally {
      setResetLoading(false);
    }
  };

  if (showResetPassword) {
    return (
      <div className="bg-white rounded-lg">
        {onClose && (
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">Reset Password</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        )}
        
        <div className="p-6">
          {!onClose && (
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 mx-auto">
                  <img src="/files_5770123-1751251303321-image.png" alt="Hustl Logo" className="w-full h-full object-contain" />
                </div>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900">Reset Password</h2>
            </div>
          )}

          <div className="text-center mb-6">
            <p className="text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="resetEmail"
                  name="resetEmail"
                  type="email"
                  autoComplete="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="username@ufl.edu"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#0F2557] focus:border-[#0F2557] sm:text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                type="submit"
                disabled={resetLoading}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white btn-gradient-primary btn-shine disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetLoading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  'Send Reset Email'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setShowResetPassword(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Need help?</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center">
              <div className="text-sm">
                <a
                  href={supportMailto}
                  className="font-medium text-[#0F2557] hover:text-[#0A1B3D] flex items-center"
                >
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Contact support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (signupSuccess && isSignUp) {
    return (
      <div className="bg-white rounded-lg">
        {onClose && (
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">Account Created</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        )}
        
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Account Created Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Your account has been created. You can now sign in with your credentials.
          </p>
          <button
            onClick={() => {
              setIsSignUp(false);
              setSignupSuccess(false);
            }}
            className="btn-gradient-primary btn-shine px-6 py-3"
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg">
      {onClose && (
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
      
      <div className="p-6">
        {!onClose && (
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 mx-auto">
                <img src="/files_5770123-1751251303321-image.png" alt="Hustl Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </h2>
          </div>
        )}

        <div className="text-center mb-6">
          <p className="text-sm text-gray-600">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-medium text-[#0F2557] hover:text-[#0A1B3D]"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          {isSignUp && (
            <>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#0F2557] focus:border-[#0F2557] sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="major" className="block text-sm font-medium text-gray-700">
                  Major
                </label>
                <div className="mt-1">
                  <input
                    id="major"
                    name="major"
                    type="text"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#0F2557] focus:border-[#0F2557] sm:text-sm"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={email === 'kaushalthota1@gmail.com' || email === 'apoorvamahajan94@gmail.com' ? 'Admin Email' : 'username@ufl.edu'}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#0F2557] focus:border-[#0F2557] sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#0F2557] focus:border-[#0F2557] sm:text-sm"
              />
            </div>
          </div>

          {isSignUp && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#0F2557] focus:border-[#0F2557] sm:text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient-primary btn-shine py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : isSignUp ? (
                'Sign up'
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>

        {!isSignUp && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Forgot your password?</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center">
              <button
                onClick={() => setShowResetPassword(true)}
                className="font-medium text-[#0F2557] hover:text-[#0A1B3D] flex items-center"
              >
                <KeyRound className="w-4 h-4 mr-1" />
                Reset password
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center">
              <div className="text-sm">
                <a
                  href={supportMailto}
                  className="font-medium text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Contact support
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;