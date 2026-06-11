import { db, auth, signIn } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Trip, OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import TripCard from './TripCard';
import { AnimatePresence, motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Map as MapIcon, Loader2 } from 'lucide-react';

export default function Explore({ onStartJourney }: { onStartJourney?: () => void }) {
  const [user] = useAuthState(auth);
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
        <div className="w-full max-w-sm">
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
        <button
          onClick={() => {
            if (!user) {
              signIn();
            } else if (onStartJourney) {
              onStartJourney();
            }
          }}
          className="flex items-center gap-2 rounded-2xl bg-natural-sage px-8 py-4 font-bold uppercase tracking-widest text-white shadow-lg shadow-natural-sage/10 transition-all hover:bg-natural-sage-hover shrink-0"
        >
          {user ? 'New Journey' : 'Sign In To Start'}
        </button>
      </header>

      {trips.length === 0 ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-4 text-natural-muted/20">
          <MapIcon className="h-16 w-16" />
          <p className="text-xl font-medium">No journeys shared yet.</p>
        </div>
      ) : !selectedTripId ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-4 text-natural-muted/50">
          <MapIcon className="h-16 w-16 opacity-30" />
          <p className="text-xl font-medium">Please select a journey from the dropdown.</p>
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
