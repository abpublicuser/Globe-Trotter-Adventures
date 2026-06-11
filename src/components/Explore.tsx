import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { Trip, OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import TripCard from './TripCard';
import { AnimatePresence, motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Map as MapIcon, Loader2 } from 'lucide-react';
import logo from '../assets/images/globe_trotter_logo_1781195701047.jpg';

export default function Explore() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'trips'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tripData: Trip[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Trip)).sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setTrips(tripData);
      setIsLoading(false);
      setError(null);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'trips');
      setIsLoading(false);
      setError(`Connection issue: ${err.message || 'Unknown error'}`);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-natural-muted/20" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-natural-muted">
        <p className="text-sm font-bold uppercase tracking-widest">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="text-xs font-bold uppercase tracking-widest text-natural-sage underline"
        >
          Try Refreshing
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end justify-between">
        <div className="w-full">
          <label htmlFor="trip-select" className="block text-sm font-bold uppercase tracking-widest text-natural-muted mb-2">
            Select a Journey
          </label>
          <select
            id="trip-select"
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
            className="w-full rounded-xl border border-natural-border bg-white px-4 py-3 text-natural-text focus:border-natural-sage focus:outline-none focus:ring-2 focus:ring-natural-sage/20"
          >
            <option value="" disabled>-- Choose a journey --</option>
            {trips.map(trip => {
              const d = trip.createdAt?.toDate?.();
              const dateStr = d ? `${d.getFullYear()} ${d.toLocaleDateString('en-US', { month: 'short' })}` : '';
              return (
                <option key={trip.id} value={trip.id}>
                  {dateStr ? `${dateStr} - ${trip.name}` : trip.name}
                </option>
              );
            })}
          </select>
        </div>
      </header>

      {trips.length === 0 ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-4 text-natural-muted/20">
          <MapIcon className="h-16 w-16" />
          <p className="text-xl font-medium">No journeys shared yet.</p>
        </div>
      ) : !selectedTripId ? (
        <div className="flex flex-col items-center justify-center gap-6 text-center mt-12 mb-16 py-16 px-4 rounded-3xl bg-white border border-natural-border shadow-sm">
          <h2 className="text-3xl font-medium tracking-tight text-natural-text sm:text-4xl mb-2">Welcome to</h2>
          <div className="relative h-48 w-48 sm:h-56 sm:w-56 overflow-hidden rounded-full shadow-md border-4 border-white">
            <img 
              src={logo} 
              alt="Globe Trotter Adventures Logo" 
              className="h-full w-full object-cover scale-105" 
            />
          </div>
          <p className="max-w-xl text-lg text-natural-muted leading-relaxed mt-4">
            Embark on a visual journey through our curated travel stories. Select a journey from the dropdown above to explore adventures and memories from around the world.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {trips.filter(t => t.id === selectedTripId).map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
