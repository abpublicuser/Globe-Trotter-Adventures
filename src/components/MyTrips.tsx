import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Trip, OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import TripCard from './TripCard';
import TripDetail from './TripDetail';
import CreateTripModal from './CreateTripModal';
import { AnimatePresence, motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Plus, Compass, Loader2 } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function MyTrips() {
  const [user] = useAuthState(auth);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedDropdownTripId, setSelectedDropdownTripId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'trips'),
      where('userId', '==', user.uid)
    );
    
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
      setError(`Sync issue: ${err.message || 'Unknown error'}`);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) return null;

  if (selectedTripId) {
    return <TripDetail tripId={selectedTripId} onBack={() => setSelectedTripId(null)} />;
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-natural-muted/20" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-natural-muted px-8 text-center">
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
          <label htmlFor="my-trip-select" className="block text-sm font-bold uppercase tracking-widest text-natural-muted mb-2">
            Select a Journey
          </label>
          <select
            id="my-trip-select"
            value={selectedDropdownTripId}
            onChange={(e) => setSelectedDropdownTripId(e.target.value)}
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

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-natural-sage px-8 py-4 font-bold uppercase tracking-widest text-white shadow-lg shadow-natural-sage/10 transition-all hover:bg-natural-sage-hover shrink-0"
        >
          <Plus className="h-5 w-5" />
          New Journey
        </motion.button>
      </header>

      {trips.length === 0 ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-4 text-natural-muted/20">
          <Compass className="h-16 w-16" />
          <p className="text-xl font-medium">No journeys yet. Where to next?</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="text-sm font-bold uppercase tracking-widest text-natural-sage hover:underline"
          >
            Start your first trip
          </button>
        </div>
      ) : !selectedDropdownTripId ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-4 text-natural-muted/50">
          <Compass className="h-16 w-16 opacity-30" />
          <p className="text-xl font-medium">Please select a journey from the dropdown.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {trips.filter(t => t.id === selectedDropdownTripId).map((trip) => (
              <TripCard 
                key={trip.id} 
                trip={trip} 
                onClick={(id) => setSelectedTripId(id)}
                isOwnerView={true}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <CreateTripModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </motion.div>
  );
}
