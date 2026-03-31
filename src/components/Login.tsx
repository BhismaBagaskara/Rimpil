import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { motion } from 'motion/react';
import { LogIn, Loader2, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-2xl p-12 border border-neutral-200 dark:border-neutral-800 text-center"
      >
        <div className="mb-8 flex justify-center">
          <div className="p-4 bg-neutral-900 dark:bg-white rounded-3xl shadow-xl">
            <ShieldCheck size={48} className="text-white dark:text-neutral-900" />
          </div>
        </div>
        
        <h1 className="text-4xl font-black tracking-tighter text-neutral-900 dark:text-neutral-100 mb-2">
          RIMPIL-TRACK
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mb-10 font-medium">
          Professional Inventory Management System
        </p>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-white rounded-2xl font-bold transition-all duration-300 shadow-xl disabled:opacity-70"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={22} />
          ) : (
            <>
              <LogIn size={22} />
              Sign in with Google
            </>
          )}
        </button>

        {error && (
          <p className="mt-6 text-sm text-red-500 font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-800">
            {error}
          </p>
        )}

        <p className="mt-10 text-xs text-neutral-400 dark:text-neutral-500">
          Secure access restricted to authorized personnel only.
        </p>
      </motion.div>
    </div>
  );
}
