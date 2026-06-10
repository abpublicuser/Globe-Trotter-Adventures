import { auth, signIn, signOut } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { User } from 'lucide-react';
import { motion } from 'motion/react';

export default function Navbar() {
  const [user] = useAuthState(auth);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-natural-border bg-natural-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-700 ease-in-out">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ rotate: -20, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-natural-sage font-display text-xl font-black italic text-white shadow-lg shadow-natural-sage/20"
          >
            G
          </motion.div>
          <span className="text-2xl font-semibold tracking-tight text-natural-text sm:text-3xl">
            Globe Trotter Gallery
          </span>
        </div>

        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-3 rounded-full border border-natural-border bg-natural-border/40 px-4 py-2">
              <div className="hidden flex-col items-end sm:flex">
                <span className="text-sm font-medium text-natural-text">{user.displayName}</span>
                <button
                  onClick={() => signOut()}
                  className="text-[10px] font-bold uppercase tracking-widest text-natural-sage transition-colors hover:text-natural-sage-hover"
                >
                  Sign Out
                </button>
              </div>
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || ''}
                  className="h-8 w-8 rounded-full border-2 border-white ring-1 ring-natural-border"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-natural-tan border-2 border-white">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => signIn()}
              className="flex items-center gap-2 rounded-full bg-natural-sage px-6 py-2 text-sm font-bold uppercase tracking-widest text-white transition-transform hover:bg-natural-sage-hover hover:scale-105 active:scale-95"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
