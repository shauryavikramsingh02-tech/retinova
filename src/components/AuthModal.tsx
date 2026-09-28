import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  CheckCircle, 
  Key, 
  LogIn,
  AlertCircle
} from 'lucide-react';
import { ClinicianUser } from '../types';
import { loginWithEmail, loginWithGoogle } from '../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ClinicianUser;
  onUserChange: (user: ClinicianUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
}) => {
  if (!isOpen) return null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const user = await loginWithEmail(email, password || 'clinical123');
      onUserChange(user);
      onClose();
    } catch (e: any) {
      setErrorMsg(e.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const user = await loginWithGoogle();
      onUserChange(user);
      onClose();
    } catch (e: any) {
      setErrorMsg(e.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Role Switchers for testing
  const handleQuickRole = async (role: 'admin' | 'clinician') => {
    setLoading(true);
    try {
      const targetEmail = role === 'admin' ? 'shauryavikramsingh02@gmail.com' : 'dr.arun@retinacare.ai';
      const user = await loginWithEmail(targetEmail, 'password');
      onUserChange(user);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-headline">Clinician Authentication</h3>
              <p className="text-xs text-slate-400">Firebase Auth & Role-Based Access Control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Status Banner */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-700 flex items-center justify-between">
          <span>Active Session:</span>
          <span className="font-semibold text-slate-900">
            {currentUser.email} ({currentUser.role.toUpperCase()})
          </span>
        </div>

        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Demo Credentials Switcher */}
          <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200 text-xs space-y-2">
            <span className="font-bold text-teal-900 block">Instant Role Switcher (Test Profiles):</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickRole('admin')}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-amber-300 font-mono font-bold rounded text-[11px] transition-colors"
              >
                Admin (Shaurya)
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole('clinician')}
                className="py-1.5 px-2 bg-teal-600 hover:bg-teal-700 text-white font-mono font-bold rounded text-[11px] transition-colors"
              >
                Standard Clinician
              </button>
            </div>
          </div>

          {/* Google Sign-In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google Clinician SSO</span>
          </button>

          <div className="flex items-center my-3">
            <div className="flex-1 border-t border-slate-200"></div>
            <span className="px-2 text-[10px] text-slate-400 font-mono uppercase">Or with institutional email</span>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Clinician Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="e.g. clinician@hospital.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In to Clinical Suite'}</span>
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
