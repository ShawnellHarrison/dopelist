import React, { useEffect, useState } from 'react';
import { X, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  mode?: 'signin' | 'upgrade';
}

export function AuthModal({ open, onClose, mode = 'signin' }: AuthModalProps) {
  const { signInAnon, signInEmail, signUpEmail } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTab(mode === 'upgrade' ? 'signup' : 'signin');
    setEmail('');
    setPw('');
    setBusy(false);
  }, [open, mode]);

  if (!open) return null;

  const isUpgradeMode = mode === 'upgrade';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl max-w-xl w-full shadow-[0_0_50px_rgba(234,179,8,0.3)]">
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-yellow-400" style={{ fontFamily: 'Impact, sans-serif' }}>
                {isUpgradeMode ? 'SAVE YOUR ACCOUNT' : 'SIGN IN'}
              </h2>
              <p className="text-gray-300 text-sm mt-1">
                {isUpgradeMode
                  ? 'Secure your All-Mighty DopeList account. Link an email to claim all your posts.'
                  : 'Start posting instantly (anonymous) or create a permanent account.'}
              </p>
            </div>
            <button onClick={onClose} className="text-white hover:text-yellow-400 transition-colors">
              <X size={28} />
            </button>
          </div>

          {!isUpgradeMode && (
            <>
              <div className="mt-6 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTab('signin')}
                  className={`py-3 rounded-xl font-bold border-2 transition-all ${
                    tab === 'signin'
                      ? 'bg-white/15 border-yellow-400 text-white shadow-[0_0_20px_rgba(234,179,8,0.4)]'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setTab('signup')}
                  className={`py-3 rounded-xl font-bold border-2 transition-all ${
                    tab === 'signup'
                      ? 'bg-white/15 border-yellow-400 text-white shadow-[0_0_20px_rgba(234,179,8,0.4)]'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <button
                  disabled={busy}
                  onClick={async () => {
                    try {
                      setBusy(true);
                      await signInAnon();
                      onClose();
                    } catch (e: any) {
                      alert(e?.message || 'Anonymous sign-in failed');
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-black py-4 rounded-xl text-lg border-2 border-white/20 disabled:opacity-60 transition-all hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]"
                >
                  {busy ? 'SIGNING IN...' : '⚡ CONTINUE ANONYMOUSLY'}
                </button>

                <div className="h-px bg-white/10 my-2" />
              </div>
            </>
          )}

          <div className={isUpgradeMode ? 'mt-6 space-y-3' : 'space-y-3'}>
            <div>
              <label className="block text-white font-bold mb-2 text-sm uppercase tracking-wide">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-white font-bold mb-2 text-sm uppercase tracking-wide">Password</label>
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/50 transition-all"
              />
            </div>

            {tab === 'signin' && !isUpgradeMode ? (
              <button
                disabled={busy}
                onClick={async () => {
                  try {
                    setBusy(true);
                    await signInEmail(email, pw);
                    onClose();
                  } catch (e: any) {
                    alert(e?.message || 'Sign in failed');
                  } finally {
                    setBusy(false);
                  }
                }}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black py-4 rounded-xl text-lg border-2 border-white/20 disabled:opacity-60 transition-all hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
              >
                {busy ? 'SIGNING IN...' : (
                  <span className="inline-flex items-center gap-2 justify-center">
                    <LogIn size={18} /> SIGN IN
                  </span>
                )}
              </button>
            ) : (
              <button
                disabled={busy}
                onClick={async () => {
                  try {
                    setBusy(true);
                    await signUpEmail(email, pw);
                    alert(isUpgradeMode ? 'Account secured. All your posts are now permanent.' : 'Welcome to All-Mighty DopeList!');
                    onClose();
                  } catch (e: any) {
                    alert(e?.message || 'Sign up failed');
                  } finally {
                    setBusy(false);
                  }
                }}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black py-4 rounded-xl text-lg border-2 border-white/20 disabled:opacity-60 transition-all hover:shadow-[0_0_25px_rgba(236,72,153,0.5)]"
              >
                {busy ? (isUpgradeMode ? 'UPGRADING...' : 'CREATING...') : (
                  <span className="inline-flex items-center gap-2 justify-center">
                    <UserPlus size={18} /> {isUpgradeMode ? 'UPGRADE ACCOUNT' : 'CREATE ACCOUNT'}
                  </span>
                )}
              </button>
            )}

            {!isUpgradeMode && (
              <p className="text-xs text-gray-400 mt-2">
                {tab === 'signup'
                  ? 'Anonymous accounts can be upgraded later by linking an email.'
                  : ''}
              </p>
            )}

            {!supabase && (
              <p className="text-xs text-red-300">
                Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
              </p>
            )}
          </div>

          {isUpgradeMode && (
            <button
              onClick={onClose}
              className="w-full mt-4 text-gray-400 hover:text-white font-bold py-2 transition-colors"
            >
              maybe later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
