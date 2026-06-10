import { auth } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import Navbar from './components/Navbar';
import Gallery from './components/Gallery';
import UploadModal from './components/UploadModal';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';

export default function App() {
  const [user] = useAuthState(auth);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text selection:bg-natural-sage selection:text-white">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-12 flex flex-col items-end justify-between gap-6 sm:flex-row">
          <div>
            <h1 className="text-4xl font-medium tracking-tight text-natural-text sm:text-6xl">
              Public Feed
            </h1>
            <p className="mt-2 text-lg italic text-natural-muted">
              Recent shared discoveries from the community
            </p>
          </div>

          {user && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-natural-sage px-8 py-4 font-bold uppercase tracking-widest text-white shadow-lg shadow-natural-sage/10 transition-all hover:bg-natural-sage-hover"
            >
              <Plus className="h-5 w-5" />
              New Moment
            </motion.button>
          )}
        </header>

        <Gallery />
      </main>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />

      {/* Footer Status Bar - Aesthetic addition from theme */}
      <footer className="mt-12 flex h-12 items-center justify-between border-t border-natural-border bg-[#F5F2EA] px-10 text-[10px] font-bold uppercase tracking-[0.2em] text-[#A69F94]">
         <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> 
            Firebase Linked
          </span>
        </div>
        <div>Globe Trotter Gallery &copy; 2026</div>
      </footer>
    </div>
  );
}
