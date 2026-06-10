import Navbar from './components/Navbar';
import Explore from './components/Explore';
import MyTrips from './components/MyTrips';
import { useState } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'explore' | 'my-trips'>('explore');

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text selection:bg-natural-sage selection:text-white">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {activeTab === 'explore' ? (
          <Explore onStartJourney={() => setActiveTab('my-trips')} />
        ) : (
          <MyTrips />
        )}
      </main>

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
